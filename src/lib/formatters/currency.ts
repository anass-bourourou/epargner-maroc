// -----------------------------------------------------------------------------
// MAD / DH formatting. Fully covered by tests in Phase 9.
// -----------------------------------------------------------------------------

const MAD_FORMATTER = new Intl.NumberFormat('fr-MA', {
  style: 'currency',
  currency: 'MAD',
  currencyDisplay: 'code',
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

const NUMBER_FORMATTER = new Intl.NumberFormat('fr-MA', {
  maximumFractionDigits: 2,
});

/** Formats a number as a MAD amount, e.g. 12 345,67 MAD. */
export function formatMAD(value: number): string {
  if (!Number.isFinite(value)) return '—';
  // Intl currency-code output uses "MAD" prefix; we normalize to "MAD" suffix
  // per Moroccan editorial convention ("12 345,67 MAD" not "MAD 12 345,67").
  return `${NUMBER_FORMATTER.format(value)} MAD`;
}

/** Alias for the shorter "DH" convention when a compact display is wanted. */
export function formatDH(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return `${NUMBER_FORMATTER.format(value)} DH`;
}

/** Formats a plain number in fr-MA locale (spaces as group separator). */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return NUMBER_FORMATTER.format(value);
}

/** Formats a decimal as a percentage, e.g. 0.045 -> "4,5 %". */
export function formatPercent(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—';
  return `${new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value * 100)} %`;
}

/** Ensures downstream callers don't accidentally rely on the raw Intl object. */
export const _internal = { MAD_FORMATTER, NUMBER_FORMATTER };
