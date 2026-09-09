// -----------------------------------------------------------------------------
// Lightweight sanitizer — strips patterns the critic can miss.
// Runs after generation, before validation. Reports each transform in `notes`.
//
// Purpose: cover the long tail of "plausibly-fabricated" statements even when
// the critic scores the article high enough for auto-publish. It's better to
// remove a suspicious sentence than to publish a fabricated fact.
// -----------------------------------------------------------------------------

// Sentence containing a specific %+source claim ("selon Bank Al-Maghrib, 42%…").
const FABRICATED_STAT_RE =
  /(?:selon|d'après|d'apres)\s+[A-Z][^.]{2,60}?,?\s*\d{1,3}[\s,.]?\d*\s?%[^.]*\./gi;

// Sentence containing a specific DH amount cited as a Moroccan average.
const FABRICATED_AVG_RE =
  /(?:en\s+moyenne\s+au\s+Maroc|moyenne\s+marocaine)[^.]*\d[\s\d.,]*\s?(?:DH|MAD|dirhams?)\.?/gi;

// Sentence claiming a specific legal article ("l'article 42 de la loi 17-99").
const FABRICATED_LAW_RE =
  /l['’]article\s+\d+[^.]{0,80}?loi[^.]*\./gi;

export function sanitizeArticle(body_mdx) {
  const notes = [];
  let out = body_mdx;

  const patterns = [
    { re: FABRICATED_STAT_RE, label: 'statistique attribuée à une source non vérifiée' },
    { re: FABRICATED_AVG_RE, label: 'moyenne marocaine chiffrée' },
    { re: FABRICATED_LAW_RE, label: 'référence à un article de loi précis' },
  ];

  for (const { re, label } of patterns) {
    const matches = out.match(re);
    if (matches) {
      for (const m of matches) {
        notes.push(`Retiré (${label}) : « ${m.trim().slice(0, 120)}${m.length > 120 ? '…' : ''} »`);
      }
      out = out.replace(re, '');
    }
  }

  // Collapse multiple blank lines that may result from removals.
  out = out.replace(/\n{3,}/g, '\n\n').trim();

  return { body: out, notes };
}
