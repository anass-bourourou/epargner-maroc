// -----------------------------------------------------------------------------
// Category constants — single source of truth for labels, routes, intros.
// -----------------------------------------------------------------------------

import type { ArticleCategory } from '../content.config';

export interface CategoryMeta {
  key: ArticleCategory;
  label: string;
  href: string;
  eyebrow: string;
  title: string;
  intro: string;
  toolCta?: { label: string; href: string };
  seoDescription: string;
}

export const CATEGORY_META: Record<ArticleCategory, CategoryMeta> = {
  epargne: {
    key: 'epargne',
    label: 'Épargne',
    href: '/epargne/',
    eyebrow: 'Épargne',
    title: 'Mieux épargner au Maroc',
    intro:
      "Comment construire une épargne régulière, choisir un support adapté et automatiser une discipline mensuelle — même à partir de peu.",
    toolCta: { label: "Ouvrir le calculateur d'épargne", href: '/outils/calculateur-epargne/' },
    seoDescription:
      "Épargne au Maroc — livrets, comptes à terme, budget, automatisation. Articles, guides et calculateurs pour construire une épargne régulière.",
  },
  banques: {
    key: 'banques',
    label: 'Banques',
    href: '/banques/',
    eyebrow: 'Banques',
    title: 'Comprendre sa banque',
    intro:
      "Frais de tenue de compte, cartes, virements, découvert, services : ce qui pèse vraiment dans une année bancaire et comment choisir en connaissance de cause.",
    seoDescription:
      "Banques au Maroc — frais, cartes, services, choix d'un compte. Articles et guides pour comprendre et comparer.",
  },
  assurances: {
    key: 'assurances',
    label: 'Assurances',
    href: '/assurances/',
    eyebrow: 'Assurances',
    title: "Lire un contrat d'assurance",
    intro:
      "Auto, habitation, santé, voyage, vie : cinq familles, une même méthode. Identifier ce qui est couvert, ce qui ne l'est pas, et ce qui coûte à l'année.",
    seoDescription:
      "Assurances au Maroc — auto, habitation, santé, voyage, vie. Articles pédagogiques pour comprendre les contrats avant de signer.",
  },
  credit: {
    key: 'credit',
    label: 'Crédit',
    href: '/credit/',
    eyebrow: 'Crédit',
    title: 'Emprunter sans se tromper',
    intro:
      "Coût réel, mensualité, taux effectif global, apport, durée : les repères indispensables avant de signer un crédit consommation, auto ou immobilier.",
    toolCta: { label: 'Ouvrir le calculateur de crédit', href: '/outils/calculateur-credit/' },
    seoDescription:
      "Crédit au Maroc — consommation, auto, immobilier. Comprendre le coût réel, la mensualité, le TAEG, et négocier son taux.",
  },
  investissement: {
    key: 'investissement',
    label: 'Investissement',
    href: '/investissement/',
    eyebrow: 'Investissement',
    title: 'Investir, une fois les bases posées',
    intro:
      "L'investissement n'est ni magique ni interdit. Il commence après l'épargne de précaution, avec des attentes réalistes et un horizon défini.",
    seoDescription:
      "Investissement au Maroc — OPCVM, Bourse de Casablanca, notions de risque, diversification. Articles pédagogiques.",
  },
  guides: {
    key: 'guides',
    label: 'Guides',
    href: '/guides/',
    eyebrow: 'Guides',
    title: 'Guides pratiques',
    intro:
      "Des guides denses et sans jargon, pensés pour être lus une fois et consultés plusieurs.",
    seoDescription:
      "Guides pratiques de finance personnelle au Maroc — épargne, banque, crédit, assurance, investissement.",
  },
  outils: {
    key: 'outils',
    label: 'Outils',
    href: '/outils/',
    eyebrow: 'Outils',
    title: 'Calculateurs financiers',
    intro:
      "Calculateurs simples pour transformer une intuition en chiffres, à partir de vos propres données.",
    seoDescription:
      "Outils et calculateurs financiers pour le Maroc — épargne, budget, crédit.",
  },
};

/** Article-only categories (excludes 'guides' and 'outils'). */
export const ARTICLE_ONLY_CATEGORIES: readonly ArticleCategory[] = [
  'epargne',
  'banques',
  'assurances',
  'credit',
  'investissement',
];

/** Safe indexed access — narrows any string to CategoryMeta. */
export function categoryMeta(
  category: string | ArticleCategory,
): CategoryMeta {
  return CATEGORY_META[category as ArticleCategory];
}
