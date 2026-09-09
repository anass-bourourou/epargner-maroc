// -----------------------------------------------------------------------------
// Shared validation helpers for calculator inputs.
// Errors are strings suitable for direct display under a form field.
// -----------------------------------------------------------------------------

/** Rounds to 2 decimals to avoid floating-point display noise. */
export function round2(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

/** Clamp a value between min and max. */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

export function nonNegative(value: number, label: string): string | null {
  if (!Number.isFinite(value)) return `${label} — valeur invalide.`;
  if (value < 0) return `${label} ne peut pas être négatif.`;
  return null;
}

export function strictlyPositive(value: number, label: string): string | null {
  if (!Number.isFinite(value)) return `${label} — valeur invalide.`;
  if (value <= 0) return `${label} doit être supérieur à 0.`;
  return null;
}

/**
 * Sensible safety bounds to avoid runaway computation on extreme inputs.
 * These are documented in each formula module.
 */
export const BOUNDS = {
  years: { min: 0, max: 60 },
  annualRatePct: { min: 0, max: 30 },
  money: { min: 0, max: 1_000_000_000 },
} as const;
