// -----------------------------------------------------------------------------
// Localized numeric input parsing.
// Accepts French / Moroccan conventions: "10 000", "2,5", "2.5", "10 000 DH".
// Returns `null` for empty or unparseable input — callers decide the fallback.
// -----------------------------------------------------------------------------

const CURRENCY_UNITS = /(dhs?|mad|€|dh)/gi;

export function parseLocalNumber(input: string | number | undefined | null): number | null {
  if (input === undefined || input === null) return null;
  if (typeof input === 'number') return Number.isFinite(input) ? input : null;

  const trimmed = input.trim();
  if (trimmed === '') return null;

  const cleaned = trimmed
    .replace(/ |\s/g, '') // regular + non-breaking spaces
    .replace(CURRENCY_UNITS, '')
    .replace(/,/g, '.'); // French decimal separator → JS

  if (!/^-?\d*\.?\d+$/.test(cleaned)) return null;

  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Parse with a fallback default when input is empty or invalid. */
export function parseWithDefault(
  input: string | number | undefined | null,
  fallback: number,
): number {
  const n = parseLocalNumber(input);
  return n === null ? fallback : n;
}
