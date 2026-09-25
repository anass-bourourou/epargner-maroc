#!/usr/bin/env node
import { readFile, writeFile, access, appendFile, readdir } from 'node:fs/promises';
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

// Seuil de similarité pour considérer un sujet comme doublon (0 à 1)
// 0.5 = 50 % des mots-clés significatifs en commun → rejeté
const DUPLICATE_THRESHOLD = 0.5;
// Protection contre queue entièrement dupliquée
const MAX_DEDUP_ATTEMPTS = 20;

async function fileExists(p) { try { await access(p); return true; } catch { return false; } }

async function ghOutput(k, v) {
  if (!process.env.GITHUB_OUTPUT) return;
  await appendFile(process.env.GITHUB_OUTPUT, `${k}=${String(v).replace(/\n/g, ' ')}\n`);
}

function parseArgs(argv) {
  const args = {};
  for (const a of argv.slice(2)) {
    const m = a.match(/^--([^=]+)=(.+)$/);
    if (m) args[m[1]] = m[2];
    else if (a.startsWith('--')) args[a.slice(2)] = true;
  }
  return args;
}

// -----------------------------------------------------------------------------
// DEDUP SÉMANTIQUE : mots-clés significatifs + similarité de Jaccard
// -----------------------------------------------------------------------------
const STOPWORDS = new Set([
  'a','au','aux','et','en','de','du','des','le','la','les','un','une',
  'son','sa','ses','mon','ma','mes','ton','ta','tes','notre','votre','leur','leurs',
  'ce','cet','cette','ces','pour','par','avec','sans','sur','sous','dans','vers',
  'comment','pourquoi','quand','quoi','qui','quel','quelle','quels','quelles',
  'est','sont','ont','avoir','etre','faire',
  '2024','2025','2026','2027',
  'maroc','marocain','marocaine','marocains','marocaines',
  'que','qu','ne','pas','plus','moins','ou','ni','si',
  'tout','toute','tous','toutes','bien','mieux',
  'the','of','and','an','in','on','to','for',
]);

function keywordSet(s) {
  return new Set(
    (s || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/[\s-]+/)
      .filter((w) => w.length >= 3 && !STOPWORDS.has(w)),
  );
}

function jaccardSimilarity(a, b) {
  const setA = keywordSet(a);
  const setB = keywordSet(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let inter = 0;
  for (const w of setA) if (setB.has(w)) inter++;
  const union = new Set([...setA, ...setB]).size;
  return inter / union;
}

async function listExistingArticles() {
  const files = await readdir(CONTENT_DIR);
  const items = [];
  for (const f of files) {
    if (!/\.(md|mdx)$/.test(f)) continue;
    const content = await readFile(path.join(CONTENT_DIR, f), 'utf8');
    const titleMatch = content.match(/^title:\s*["']?(.+?)["']?\s*$/m);
    const slug = f.replace(/\.(md|mdx)$/, '');
    items.push({ slug, title: titleMatch ? titleMatch[1] : slug });
  }
  return items;
}

async function findDuplicateOf(topic, existing, threshold = DUPLICATE_THRESHOLD) {
  let best = null;
  for (const e of existing) {
    const simSlug = jaccardSimilarity(topic, e.slug);
    const simTitle = jaccardSimilarity(topic, e.title);
    const sim = Math.max(simSlug, simTitle);
    if (sim >= threshold && (!best || sim > best.similarity)) {
      best = { existing: e, similarity: sim };
    }
  }
  return best;
}

// -----------------------------------------------------------------------------
async function refillQueue(ideas) {
  const publishedFiles = await readdir(CONTENT_DIR);
  const publishedTitles = [];
  for (const f of publishedFiles) {
    if (!/\.(md|mdx)$/.test(f)) continue;
    const content = await readFile(path.join(CONTENT_DIR, f), 'utf8');
    const m = content.match(/^title:\s*["']?(.+?)["']?\s*$/m);
    if (m) publishedTitles.push(m[1]);
  }
  const existingTopics = ideas.map((i) => i.topic);

  console.log('[refill] Queue vide — appel Gemini pour 10 nouveaux sujets…');

  const IDEAS_SCHEMA = {
    type: 'object',
    properties: {
      ideas: {
        type: 'array', minItems: 5, maxItems: 12,
        items: {
          type: 'object',
          properties: {
            topic: { type: 'string' },
            category: { type: 'string', enum: ['epargne','banques','assurances','credit','investissement'] },
            angle: { type: 'string' },
          },
          required: ['topic', 'category', 'angle'],
        },
      },
    },
    required: ['ideas'],
  };

  const response = await generateStructured({
    systemPrompt: `Tu es rédacteur en chef d'Épargner Maroc, publication marocaine de finance personnelle. Propose 10 nouveaux sujets d'articles pertinents pour un lecteur marocain, RADICALEMENT DIFFÉRENTS de ceux déjà publiés ou en file (thème, angle, mots-clés). Répartir entre epargne, banques, assurances, credit, investissement. Angles pratiques, pas conceptuels. Contexte Bank Al-Maghrib, ACAPS, Bourse de Casablanca. Retourner strictement le JSON.`,
    userPrompt: `Articles déjà publiés :\n${publishedTitles.map((t) => '- ' + t).join('\n') || '(aucun)'}\n\nSujets déjà proposés :\n${existingTopics.map((t) => '- ' + t).join('\n') || '(aucun)'}\n\nPropose 10 NOUVEAUX sujets radicalement différents des thèmes ci-dessus. Aucun recoupement de mots-clés majeurs.`,
    schema: IDEAS_SCHEMA,
    temperature: 0.9,
  });

  const existingLower = new Set(
    [...existingTopics, ...publishedTitles].map((t) => t.toLowerCase().trim()),
  );

  const existingArticles = await listExistingArticles();
  const fresh = [];
  for (const i of response.ideas || []) {
    if (!i.topic) continue;
    if (existingLower.has(i.topic.toLowerCase().trim())) continue;
    const dupe = await findDuplicateOf(i.topic, existingArticles);
    if (dupe) {
      console.warn(
        `[refill]  ⏭  Sujet proposé rejeté (doublon ${(dupe.similarity * 100).toFixed(0)}% avec "${dupe.existing.slug}") : ${i.topic}`,
      );
      continue;
    }
    fresh.push({ ...i, used: false });
  }

  console.log(`[refill] ✅ ${fresh.length} nouveau(x) sujet(s) ajouté(s) (sur ${response.ideas?.length || 0} proposés).`);
  return [...ideas, ...fresh];
}

// -----------------------------------------------------------------------------
async function pickNextIdea() {
  let ideas = JSON.parse(await readFile(IDEAS_PATH, 'utf8'));
  const existingArticles = await listExistingArticles();

  for (let attempt = 0; attempt < MAX_DEDUP_ATTEMPTS; attempt++) {
    let pending = ideas.filter((i) => !i.used);

    if (pending.length === 0) {
      ideas = await refillQueue(ideas);
      await writeFile(IDEAS_PATH, JSON.stringify(ideas, null, 2) + '\n');
      pending = ideas.filter((i) => !i.used);
      if (pending.length === 0) {
        console.error("[generate] Refill n'a rien produit — abandon.");
        return null;
      }
    }

    const idea = pending[0];
    const dupe = await findDuplicateOf(idea.topic, existingArticles);

    if (!dupe) return idea;

    console.warn(
      `[generate] ⏭  Sujet ignoré (doublon ${(dupe.similarity * 100).toFixed(0)}% avec "${dupe.existing.slug}") : ${idea.topic}`,
    );
    const idx = ideas.findIndex((i) => i.topic === idea.topic && i.category === idea.category);
    if (idx >= 0) {
      ideas[idx].used = true;
      ideas[idx].skippedReason = `duplicate of ${dupe.existing.slug} (${(dupe.similarity * 100).toFixed(0)}%)`;
      ideas[idx].skippedAt = new Date().toISOString();
      await writeFile(IDEAS_PATH, JSON.stringify(ideas, null, 2) + '\n');
    }
  }

  console.error(`[generate] Aucun sujet non-doublon trouvé après ${MAX_DEDUP_ATTEMPTS} essais.`);
  return null;
}

// -----------------------------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv);
  const forceReview = Boolean(args['no-auto-publish']);

  let idea;
  if (args.topic && args.category) {
    idea = { topic: args.topic, category: args.category, angle: args.angle ?? 'Angle pédagogique.' };
    const existingArticles = await listExistingArticles();
    const dupe = await findDuplicateOf(idea.topic, existingArticles);
    if (dupe) {
      console.error(
        `[generate] ⛔ Sujet manuel trop proche d'un existant (${(dupe.similarity * 100).toFixed(0)}%) : ${dupe.existing.slug}`,
      );
      if (!args['force-topic']) process.exit(4);
    }
  } else {
    idea = await pickNextIdea();
    if (!idea) {
      console.error('[generate] Aucun sujet disponible.');
      process.exit(0);
    }
  }

  console.log(`[generate] Sujet : ${idea.topic}`);
  const slug = idea.slug ? slugify(idea.slug) : slugify(idea.topic).slice(0, 80);
  const targetMdx = path.join(CONTENT_DIR, `${slug}.mdx`);
  const targetMd = path.join(CONTENT_DIR, `${slug}.md`);
  if (await fileExists(targetMdx) || await fileExists(targetMd)) {
    console.error(`[generate] ⛔ Article existe déjà : ${slug}`);
    process.exit(2);
  }

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

  const { body: cleanBody, notes: sanitizeNotes } = sanitizeArticle(article.body_mdx);
  article.body_mdx = cleanBody;
  if (sanitizeNotes.length > 0) {
    console.log(`[generate] Sanitizer a retiré ${sanitizeNotes.length} passage(s).`);
  }

  console.log('[generate] Pass 2 · critique…');
  const review = await reviewArticle({
    title: article.title,
    description: article.description,
    category: idea.category,
    body_mdx: article.body_mdx,
  });
  console.log(`[generate] Verdict : ${review.verdict} · score ${review.score}/100`);

  if (review.verdict === 'reject') {
    console.error('[generate] ❌ Rejeté.');
    await ghOutput('verdict', 'reject');
    process.exit(3);
  }

  const willAutoPublish = review.verdict === 'auto_publish' && !forceReview;
  const draft = !willAutoPublish;
  const aiReview = {
    score: review.score,
    notes: [
      `Verdict : ${review.verdict}`,
      ...sanitizeNotes.map((n) => `Sanitizer : ${n}`),
      ...review.softs.map((s) => `Soft : ${s}`),
    ],
  };

  const filePath = await writeMdxArticle({
    slug, category: idea.category, article, contentDir: CONTENT_DIR,
    draft, aiGenerated: true, aiReview,
  });
  console.log(`[generate] ✅ ${draft ? 'Draft' : 'Auto-publié'} : ${path.relative(ROOT, filePath)}`);

  if (!args.topic) {
    const ideas = JSON.parse(await readFile(IDEAS_PATH, 'utf8'));
    const idx = ideas.findIndex((i) => i.topic === idea.topic && i.category === idea.category);
    if (idx >= 0) {
      ideas[idx].used = true;
      ideas[idx].generatedAt = new Date().toISOString();
      ideas[idx].slug = slug;
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
