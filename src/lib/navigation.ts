// -----------------------------------------------------------------------------
// Single source of truth for site navigation.
// Used by Header, Footer, and future breadcrumbs.
// -----------------------------------------------------------------------------

export interface NavItem {
  label: string;
  href: string;
}

export const PRIMARY_NAV: readonly NavItem[] = [
  { label: 'Épargne', href: '/epargne/' },
  { label: 'Banques', href: '/banques/' },
  { label: 'Assurances', href: '/assurances/' },
  { label: 'Crédit', href: '/credit/' },
  { label: 'Investissement', href: '/investissement/' },
  { label: 'Outils', href: '/outils/' },
  { label: 'Guides', href: '/guides/' },
] as const;

export interface FooterGroup {
  title: string;
  items: readonly NavItem[];
}

export const FOOTER_GROUPS: readonly FooterGroup[] = [
  {
    title: 'Finance',
    items: [
      { label: 'Épargne', href: '/epargne/' },
      { label: 'Banques', href: '/banques/' },
      { label: 'Assurances', href: '/assurances/' },
      { label: 'Crédit', href: '/credit/' },
      { label: 'Investissement', href: '/investissement/' },
    ],
  },
  {
    title: 'Outils',
    items: [
      { label: 'Calculateur d’épargne', href: '/outils/calculateur-epargne/' },
      { label: 'Calculateur de crédit', href: '/outils/calculateur-credit/' },
      { label: 'Budget mensuel', href: '/outils/budget/' },
      { label: 'Tous les outils', href: '/outils/' },
    ],
  },
  {
    title: 'Guides',
    items: [
      { label: 'Débuter l’épargne', href: '/guides/debuter-epargne/' },
      { label: 'Comprendre le crédit', href: '/guides/comprendre-credit/' },
      { label: 'Tous les guides', href: '/guides/' },
    ],
  },
  {
    title: 'À propos',
    items: [
      { label: 'À propos', href: '/a-propos/' },
      { label: 'Méthodologie', href: '/methodologie/' },
      { label: 'Contact', href: '/contact/' },
    ],
  },
] as const;

export const LEGAL_NAV: readonly NavItem[] = [
  { label: 'Mentions légales', href: '/legal/mentions-legales/' },
  { label: 'Politique de confidentialité', href: '/legal/confidentialite/' },
  { label: 'Cookies', href: '/legal/cookies/' },
] as const;
