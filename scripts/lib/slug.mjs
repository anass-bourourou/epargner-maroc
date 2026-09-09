// French/Moroccan slug generator — strips diacritics, lowercase, dash-separated.

const DIACRITICS = /[̀-ͯ]/g;

export function slugify(input) {
  return String(input)
    .normalize('NFKD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}
