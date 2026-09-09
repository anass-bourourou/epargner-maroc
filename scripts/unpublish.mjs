#!/usr/bin/env node
// -----------------------------------------------------------------------------
// unpublish.mjs — révoquer un article auto-publié en 1 commande.
//
// Rebascule `draft: true` sur l'article, ce qui le retire du site public au
// prochain build. À utiliser si vous voyez qu'un article auto-publié est faux
// ou hors-ton.
//
//   npm run unpublish -- --slug=comment-lire-son-relevé-bancaire
// -----------------------------------------------------------------------------

import { readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
const CONTENT_DIR = path.join(ROOT, 'src/content/articles');

function args() {
  const out = {};
  for (const a of process.argv.slice(2)) {
    const m = a.match(/^--([^=]+)=(.+)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

async function fileExists(p) { try { await access(p); return true; } catch { return false; } }

async function main() {
  const { slug } = args();
  if (!slug) {
    console.error('Usage : npm run unpublish -- --slug=<slug>');
    process.exit(1);
  }

  for (const ext of ['mdx', 'md']) {
    const p = path.join(CONTENT_DIR, `${slug}.${ext}`);
    if (!(await fileExists(p))) continue;
    let content = await readFile(p, 'utf8');
    if (/^draft:\s*true$/m.test(content)) {
      console.log(`[unpublish] ${slug} est déjà draft.`);
      return;
    }
    content = content.replace(/^draft:\s*false$/m, 'draft: true');
    // If the field is missing, insert it after author line.
    if (!/^draft:\s*(true|false)$/m.test(content)) {
      content = content.replace(/^(author:\s.+)$/m, `$1\ndraft: true`);
    }
    await writeFile(p, content);
    console.log(`[unpublish] ✅ ${slug} a été passé en draft: true`);
    console.log('           Committez + poussez sur main pour retirer du site.');
    return;
  }

  console.error(`[unpublish] Article introuvable : ${slug}`);
  process.exit(2);
}

main().catch((e) => { console.error(e); process.exit(1); });
