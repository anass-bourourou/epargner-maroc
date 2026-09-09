#!/usr/bin/env node
// -----------------------------------------------------------------------------
// generate-article.mjs — Épargner Maroc content pipeline (auto-publish mode)
//
// Pipeline en deux passes IA + sanitizer + garde-fous :
//   1. Génération de l'article (Gemini pass 1, prompt éditorial)
//   2. Sanitizer : retire les patterns dangereux (stats fabriquées, articles de loi)
//   3. Critic (Gemini pass 2, prompt adversarial) → score + verdict
//   4. Décision :
//        - verdict = auto_publish  → écrit draft: false, aiGenerated: true → publie
//        - verdict = needs_review  → écrit draft: true → PR de revue
//        - verdict = reject        → n'écrit rien
//
// Sorties utilisées par le workflow GitHub Actions (via GITHUB_OUTPUT) :
//   slug, path, title, verdict, score
// -----------------------------------------------------------------------------

import { readFile, writeFile, access, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateStructured } from './lib/gemini.mjs';
import { SYSTEM_PROMPT, buildUserPrompt, RESPONSE_SCHEMA } from './lib/prompt.mjs';
import { writeMdxArticle, validateGenerated } from './lib/mdx.mjs';
import { slugify } from './lib/slug.mjs';
import { reviewArticle } from './lib/critic.mjs';
import { sanitizeArticle } from './lib/sanitize.mjs';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
const IDEAS_PATH = path.join(ROOT, 'content-ideas.json');
const CONTENT_DIR = path.join(ROOT, 'src/content/articles');

function parseArgs(argv) {
  const args = {};
  for (const a of argv.slice(2)) {
    const m = a.match(/^--([^=]+)=(.+)$/);
    if (m) args[m[1]] = m[2];
    else if (a.startsWith('--')) args[a.slice(2)] = true;
  }
  return args;
}

async function fileExists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function ghOutput(k, v) {
  if (!process.env.GITHUB_OUTPUT) return;
  await appendFile(process.env.GITHUB_OUTPUT, `${k}=${String(v).replace(/\n/g, ' ')}\n`);
}

async function main() {
  const args = parseArgs(process.argv);
  const forceReview = Boolean(args['no-auto-publish']); // opt-out per invocation

  // 1. Determine the idea
  let idea;
  if (args.topic && args.category) {
    idea = { topic: args.topic, category: args.category,
             angle: args.angle ?? 'Angle pédagogique et pratique pour un lecteur marocain.' };
  } else {
    const rawIdeas = await readFile(IDEAS_PATH, 'utf8');
    const ideas = JSON.parse(rawIdeas);
    const pending = ideas.filter((i) => !i.used);
    if (pending.length === 0) {
      console.log('[generate] Aucune idée en attente.');
      process.exit(0);
    }
    idea = pending[args.index ? Number(args.index) : 0] ?? pending[0];
  }

  console.log(`[generate] Sujet : ${idea.topic}`);
  const slug = idea.slug ? slugify(idea.slug) : slugify(idea.topic).slice(0, 80);
  const targetMdx = path.join(CONTENT_DIR, `${slug}.mdx`);
  const targetMd = path.join(CONTENT_DIR, `${slug}.md`);
  if (await fileExists(targetMdx) || await fileExists(targetMd)) {
    console.error(`[generate] ⛔ Article existe déjà : ${slug}`);
    process.exit(2);
  }

  // 2. First pass — generation
  console.log('[generate] Pass 1 · génération…');
  const article = await generateStructured({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: buildUserPrompt(idea),
    schema: RESPONSE_SCHEMA,
    temperature: 0.7,
  });

  const errors = validateGenerated(article);
  if (errors.length > 0) {
    console.error('[generate] ⛔ Réponse invalide :');
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  // 3. Sanitizer — remove obvious fabricated patterns
  const { body: cleanBody, notes: sanitizeNotes } = sanitizeArticle(article.body_mdx);
  article.body_mdx = cleanBody;
  if (sanitizeNotes.length > 0) {
    console.log(`[generate] Sanitizer a retiré ${sanitizeNotes.length} passage(s) suspect(s).`);
    for (const n of sanitizeNotes) console.log(`  - ${n}`);
  }

  // 4. Second pass — critic
  console.log('[generate] Pass 2 · critique adversariale…');
  const review = await reviewArticle({
    title: article.title,
    description: article.description,
    category: idea.category,
    body_mdx: article.body_mdx,
  });
  console.log(`[generate] Verdict : ${review.verdict} · score ${review.score}/100`);
  if (review.blockers.length > 0) {
    console.log('[generate] Blockers :');
    for (const b of review.blockers) console.log(`  ⛔ ${b}`);
  }
  if (review.softs.length > 0) {
    console.log('[generate] Softs :');
    for (const s of review.softs) console.log(`  ⚠️  ${s}`);
  }

  // 5. Decision
  if (review.verdict === 'reject') {
    console.error('[generate] ❌ Article rejeté (score trop bas). Rien n\'est écrit.');
    await ghOutput('verdict', 'reject');
    await ghOutput('score', review.score);
    process.exit(3);
  }

  const willAutoPublish = review.verdict === 'auto_publish' && !forceReview;
  const draft = !willAutoPublish;
  const aiReview = {
    score: review.score,
    notes: [
      `Verdict critique IA : ${review.verdict}`,
      ...sanitizeNotes.map((n) => `Sanitizer : ${n}`),
      ...review.softs.map((s) => `Soft : ${s}`),
    ],
  };

  const filePath = await writeMdxArticle({
    slug,
    category: idea.category,
    article,
    contentDir: CONTENT_DIR,
    draft,
    aiGenerated: true,
    aiReview,
  });
  console.log(`[generate] ✅ ${draft ? 'Draft écrit' : 'Auto-publié'} : ${path.relative(ROOT, filePath)}`);

  // 6. Mark idea used
  if (!args.topic) {
    const rawIdeas = await readFile(IDEAS_PATH, 'utf8');
    const ideas = JSON.parse(rawIdeas);
    const idx = ideas.findIndex((i) => i.topic === idea.topic && i.category === idea.category);
    if (idx >= 0) {
      ideas[idx].used = true;
      ideas[idx].generatedAt = new Date().toISOString();
      ideas[idx].slug = slug;
      ideas[idx].verdict = review.verdict;
      ideas[idx].score = review.score;
      await writeFile(IDEAS_PATH, JSON.stringify(ideas, null, 2) + '\n');
    }
  }

  await ghOutput('slug', slug);
  await ghOutput('path', path.relative(ROOT, filePath));
  await ghOutput('title', article.title);
  await ghOutput('verdict', review.verdict);
  await ghOutput('score', review.score);
  await ghOutput('draft', draft ? 'true' : 'false');
}

main().catch((err) => {
  console.error(`[generate] ❌ ${err.message}`);
  process.exit(1);
});
