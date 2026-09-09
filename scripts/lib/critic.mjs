// -----------------------------------------------------------------------------
// Second-pass "critic" — an adversarial LLM review of a generated article.
// Its job is to catch the mistakes the first pass tends to make:
//   - specific % / DH figures presented as facts
//   - references to laws / articles by number
//   - claims about specific banks / insurers / rankings
//   - promises of returns
//   - implied medical / legal / tax advice
//
// The critic returns a score (0-100) and a list of issues. The workflow
// auto-publishes only when score >= AUTO_PUBLISH_THRESHOLD AND no BLOCKER
// issue is raised. Anything else opens a PR for a human.
// -----------------------------------------------------------------------------

import { generateStructured } from './gemini.mjs';

export const AUTO_PUBLISH_THRESHOLD = 75;

const CRITIC_SYSTEM = `Tu es un fact-checker éditorial pour une publication marocaine de finance personnelle.

Tu reçois un article MDX. Ta mission : identifier les risques éditoriaux.

Signale comme BLOCKER (empêche la publication automatique) :
- Toute affirmation chiffrée sans source ("selon X, Y% des Marocains…", "les frais bancaires atteignent Y DH en moyenne au Maroc…", un taux directeur précis, un rendement précis, une part de marché précise).
- Toute référence à un article de loi précis (par numéro).
- Toute mention nommée d'une banque, d'un assureur ou d'un courtier avec un jugement de valeur ("la meilleure banque", "la plus fiable"…).
- Toute promesse de rendement ou de garantie.
- Tout conseil personnel prescriptif ("vous devriez souscrire ce produit").

Signale comme SOFT (n'empêche PAS la publication mais mérite une revue) :
- Formulation générique ou vague.
- Ton non-éditorial (trop marketing, tournures IA).
- Redondance interne.

Note l'article de 0 à 100 :
- 100 = éditorial, pédagogique, aucun risque
- 75-99 = OK pour auto-publication
- 50-74 = revue humaine recommandée
- 0-49 = à jeter ou réécrire

Renvoie strictement le JSON.`;

const SCHEMA = {
  type: 'object',
  properties: {
    score: { type: 'integer', minimum: 0, maximum: 100 },
    verdict: { type: 'string', enum: ['auto_publish', 'needs_review', 'reject'] },
    blockers: { type: 'array', items: { type: 'string' } },
    softs: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
  },
  required: ['score', 'verdict', 'blockers', 'softs', 'summary'],
};

export async function reviewArticle({ title, description, category, body_mdx }) {
  const userPrompt = `Article à réviser :

TITRE : ${title}
DESCRIPTION : ${description}
CATÉGORIE : ${category}

CORPS MDX :
---
${body_mdx}
---

Renvoie le JSON.`;

  const review = await generateStructured({
    systemPrompt: CRITIC_SYSTEM,
    userPrompt,
    schema: SCHEMA,
    temperature: 0.2, // low temperature — the critic should be deterministic
  });

  // Force verdict to match blocker count + score, even if the model disagrees.
  if (review.blockers.length > 0) review.verdict = 'needs_review';
  if (review.score >= AUTO_PUBLISH_THRESHOLD && review.blockers.length === 0) {
    review.verdict = 'auto_publish';
  } else if (review.score < 50) {
    review.verdict = 'reject';
  } else {
    review.verdict = review.verdict === 'auto_publish' ? 'needs_review' : review.verdict;
  }

  return review;
}
