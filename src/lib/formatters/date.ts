// -----------------------------------------------------------------------------
// French date formatting for Épargner Maroc.
// -----------------------------------------------------------------------------

const LONG = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const SHORT = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
});

/** "18 août 2026" */
export function formatDateLong(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return LONG.format(d);
}

/** "18 août" — for compact listings */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return SHORT.format(d).replace(/\.$/, '');
}
