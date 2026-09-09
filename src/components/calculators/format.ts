// -----------------------------------------------------------------------------
// Presentation helpers for calculator React components.
// Kept in a tiny module so we can import the same formatters from React and
// keep them tree-shakeable — Astro formatters have no React dep either.
// -----------------------------------------------------------------------------

export {
  formatMAD,
  formatDH,
  formatNumber,
  formatPercent,
} from '../../lib/formatters/currency';

/** Round to nearest whole DH for compact display in calculators. */
export function roundDh(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n);
}
