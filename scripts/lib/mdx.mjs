// Serialize a generated article to an MDX file with valid frontmatter.

import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const CATEGORIES = ['epargne', 'banques', 'assurances', 'credit', 'investissement', 'guides'];

function yamlEscape(str) {
  return `"${String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function toFrontmatter({
  title,
  description,
  category,
  tags,
  sources,
  draft,
  aiGenerated,
  aiReview,
}) {
  const lines = ['---'];
  lines.push(`title: ${yamlEscape(title)}`);
  lines.push(`description: ${yamlEscape(description)}`);
  lines.push(`category: ${category}`);
  lines.push(`tags: [${tags.map((t) => yamlEscape(t)).join(', ')}]`);
  lines.push(`author: redaction`);
  lines.push(`publishedAt: ${new Date().toISOString().slice(0, 10)}`);
  lines.push(`draft: ${draft ? 'true' : 'false'}`);
  if (aiGenerated) lines.push('aiGenerated: true');
  if (aiReview) {
    lines.push('aiReview:');
    if (typeof aiReview.score === 'number') lines.push(`  score: ${aiReview.score}`);
    lines.push(`  reviewedAt: ${new Date().toISOString()}`);
    if (aiReview.notes && aiReview.notes.length > 0) {
      lines.push('  notes:');
      for (const n of aiReview.notes) lines.push(`    - ${yamlEscape(n)}`);
    } else {
      lines.push('  notes: []');
    }
  }
  if (sources && sources.length > 0) {
    lines.push('sources:');
    for (const s of sources) {
      lines.push(`  - label: ${yamlEscape(s.label)}`);
      if (s.publisher) lines.push(`    publisher: ${yamlEscape(s.publisher)}`);
      if (s.url) lines.push(`    url: ${yamlEscape(s.url)}`);
    }
  } else {
    lines.push('sources: []');
  }
  lines.push('---');
  return lines.join('\n');
}

export function validateGenerated(a) {
  const errors = [];
  if (!a || typeof a !== 'object') errors.push('réponse non-objet');
  else {
    if (!a.title || a.title.trim().length < 4) errors.push('title trop court');
    if (a.title && a.title.length > 120) errors.push('title trop long');
    if (!a.description || a.description.trim().length < 20)
      errors.push('description trop courte');
    if (!a.description || a.description.length > 300)
      errors.push('description trop longue');
    if (!Array.isArray(a.tags) || a.tags.length === 0) errors.push('tags manquants');
    if (!a.body_mdx || a.body_mdx.trim().length < 400)
      errors.push('body_mdx trop court (< 400 caractères)');
    if (a.body_mdx && !/\n##\s+/.test(a.body_mdx))
      errors.push('body_mdx sans H2 (## …)');
  }
  return errors;
}

export async function writeMdxArticle({
  slug,
  category,
  article,
  contentDir,
  draft = true,
  aiGenerated = false,
  aiReview = undefined,
}) {
  if (!CATEGORIES.includes(category)) {
    throw new Error(`Catégorie invalide : "${category}". Valeurs : ${CATEGORIES.join(', ')}`);
  }
  const frontmatter = toFrontmatter({
    title: article.title.trim(),
    description: article.description.trim(),
    category,
    tags: article.tags.map((t) => t.toLowerCase().trim()),
    sources: article.sources ?? [],
    draft,
    aiGenerated,
    aiReview,
  });
  const body = article.body_mdx.trim();
  const filePath = path.join(contentDir, `${slug}.mdx`);
  await writeFile(filePath, `${frontmatter}\n\n${body}\n`, { flag: 'wx' });
  return filePath;
}
