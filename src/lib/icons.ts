// -----------------------------------------------------------------------------
// SVG icon registry — thin 1.5px strokes, currentColor, 24×24 viewBox.
// Icons are inlined at build time by the <Icon /> component; no runtime cost.
// Do NOT introduce Material Symbols or third-party icon libraries.
// -----------------------------------------------------------------------------

export type IconName =
  | 'search'
  | 'menu'
  | 'arrow-right'
  | 'arrow-up-right'
  | 'chevron-down'
  | 'chevron-right'
  | 'check'
  | 'close'
  | 'external-link'
  | 'calendar'
  | 'clock'
  | 'calculator'
  | 'info';

export const ICONS: Record<IconName, string> = {
  search:
    '<circle cx="11" cy="11" r="6.25"/><path d="M20 20l-4.5-4.5"/>',
  menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
  'arrow-right': '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
  'arrow-up-right':
    '<path d="M7 17L17 7"/><path d="M8.5 7H17v8.5"/>',
  'chevron-down': '<path d="M6 9l6 6 6-6"/>',
  'chevron-right': '<path d="M9 6l6 6-6 6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  close: '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
  'external-link':
    '<path d="M14 5h5v5"/><path d="M19 5l-9 9"/><path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>',
  calendar:
    '<rect x="4" y="5.5" width="16" height="14.5" rx="1.5"/><path d="M4 10h16"/><path d="M9 3v4"/><path d="M15 3v4"/>',
  clock: '<circle cx="12" cy="12" r="8.25"/><path d="M12 7.5V12l3 2"/>',
  calculator:
    '<rect x="5" y="3.5" width="14" height="17" rx="1.5"/><path d="M8 7.5h8"/><circle cx="8.5" cy="12" r=".6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r=".6" fill="currentColor" stroke="none"/><circle cx="15.5" cy="12" r=".6" fill="currentColor" stroke="none"/><circle cx="8.5" cy="15.5" r=".6" fill="currentColor" stroke="none"/><circle cx="12" cy="15.5" r=".6" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r=".6" fill="currentColor" stroke="none"/>',
  info: '<circle cx="12" cy="12" r="8.25"/><path d="M12 11v5"/><circle cx="12" cy="8" r=".7" fill="currentColor" stroke="none"/>',
};
