# Épargner Maroc

Publication et outils de finance personnelle pour le Maroc — épargne, banques,
assurances, crédit, investissement, guides et calculateurs.

Site en français (extensible à l'arabe sans réécriture). Devise : MAD / DH.

## Stack

- **[Astro 5](https://astro.build/)** — rendu statique éditorial, îlots React ciblés
- **TypeScript** (strict)
- **React 18** — uniquement pour les composants réellement interactifs
  (calculateurs, comparateurs, recherche)
- **Tailwind CSS 4** — tokens de design centralisés dans `src/styles/global.css`
- **MDX** + **Content Collections** — articles, guides, auteurs typés
- **@astrojs/sitemap**, **@astrojs/rss** — SEO
- **ESLint** + **Prettier**

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev        # serveur local (http://localhost:4321)
npm run check      # vérification TypeScript & Astro
npm run lint       # ESLint
npm run format     # Prettier
```

## Build

```bash
npm run build      # build de production dans ./dist
npm run preview    # aperçu du build de production
```

## Variables d'environnement

Aucune n'est requise pour la Phase 1. Les futures intégrations (newsletter,
analytique, n8n) utiliseront `.env` (voir `.env.example` à venir).

## Création de contenu

Les articles vivent dans `src/content/articles/*.mdx`. Chaque article utilise
le frontmatter typé défini dans `src/content.config.ts` :

```yaml
---
title: Comment épargner au Maroc
description: Un guide pratique pour démarrer une épargne régulière.
category: epargne
tags: [épargne, débutant]
author: redaction
publishedAt: 2026-09-01
featured: true
sources:
  - label: Bank Al-Maghrib — Rapport annuel
    url: https://www.bkam.ma/
---
```

Les guides longs (`src/content/guides/`) et les auteurs (`src/content/authors/`)
suivent le même modèle.

## Architecture

```
src/
├── components/
│   ├── ui/            composants génériques (Wordmark, Button, ...)
│   ├── layout/        header, footer
│   ├── navigation/    menus, breadcrumbs
│   ├── articles/      cartes d'article, meta, TOC
│   ├── editorial/     composants MDX (Callout, Quote, ...)
│   ├── finance/       nombres financiers, formatage
│   ├── calculators/   îlots React (épargne, crédit, budget)
│   ├── insurance/     pages produits
│   ├── comparisons/   tableaux comparatifs
│   └── newsletter/    formulaire
├── layouts/           BaseLayout, ArticleLayout, GuideLayout
├── pages/             routes /epargne, /banques, ...
├── content/           articles, guides, auteurs (MDX)
├── data/              données statiques (banques, assurances)
├── lib/               calculs financiers, formateurs, SEO, utils
├── styles/            global.css (tokens Tailwind v4 + base)
└── types/
```

### Îlots React

React n'est chargé que sur les composants marqués `client:*`. Les pages restent
en HTML statique — critique pour les Core Web Vitals.

### Design system

Le brief V3 approuvé est la source de vérité :

- Couleurs : forêt profonde, ivoire chaud, charbon, sauge, terracotta.
- Typographie : **Playfair Display** (titres) + **Public Sans** (UI/corps).
- Pas de gradients, glassmorphism, dashboards SaaS génériques.

Tous les tokens sont dans `src/styles/global.css` (`@theme`) et exposés à
Tailwind + composants via variables CSS.

## Déploiement

Cible : hébergement statique (Cloudflare Pages, Netlify, Vercel).
`npm run build` produit `./dist` — tout est statique en Phase 1.

## Intégration n8n (à venir)

Prévue mais non implémentée. Points d'intégration propres pour :
génération d'articles assistée par IA, vérification éditoriale humaine,
génération SEO, publication Git, distribution sociale.

**Aucun contenu financier ne sera publié sans revue humaine.**

## Statut

- **Phase 1 — Fondations** : ✅ initialisation, design tokens de base,
  layout de base, schémas de contenu, build sans erreur.
- **Phase 2 — Design system** : ✅ polices self-hostées (WOFF2), tokens
  complets, échelle typographique, système d'espacement, icônes SVG,
  composants Button/Input/Select/Badge/Callout/Card/ArticleCard/…, Header
  + Footer, page de validation `/design-system/` (noindex).
- **Phase 3 — Homepage** : ✅ hero éditorial + visualisation SVG, section
  valeur, outils, articles à la une, sections Épargne / Banques /
  Assurances / Crédit / Investissement / Guides, newsletter (UI seule).
- **Phase 4 — Moteur éditorial** : ✅ pages article dynamiques
  (`/articles/[slug]/`), pages guide (`/guides/[slug]/`), 5 pages
  catégorie (`/epargne/`, `/banques/`, `/assurances/`, `/credit/`,
  `/investissement/`), archives `/articles/` et `/guides/`, hub
  `/outils/` + 3 fiches en préparation, page `/404`, flux `/rss.xml`.
  Table des matières auto (H2/H3), breadcrumbs + JSON-LD BreadcrumbList,
  JSON-LD Article, sources, boîte auteur, articles associés (score
  déterministe), guides associés, callouts éditoriaux (Callout,
  KeyTakeaway, Quote, ComparisonTable, CalculatorEmbed, FinancialNumber)
  disponibles globalement dans MDX.

- **Phase 5 — Calculateurs financiers** : ✅ trois calculateurs réels
  (épargne, budget, crédit) montés en îlots React (`client:load`),
  formules pures TypeScript testées sous Vitest (31 tests OK), SVG chart
  d'épargne, barres empilées budget & crédit, disclaimers par outil,
  contenu éditorial complet sous chaque calculateur, hub `/outils/`
  finalisé. Homepage et éditorial restent 100 % HTML statique — React
  n'est chargé que sur les 3 pages outil.

- **Phase 6 — Assurances + architecture de comparateur** : ✅ 5 sous-pages
  d'assurance (Auto, Habitation, Santé, Voyage, Vie), architecture
  comparateur réutilisable (données typées, bloc méthodologie transparent,
  bandeau « Exemple pédagogique » sur les lignes illustratives),
  briefing "couvert / non couvert / questions à poser" par famille.
  Aucune donnée fabriquée : les cellules du comparateur sont des exemples
  éditoriaux clairement étiquetés — à remplacer par des offres sourcées.

- **Phase 7 — SEO avancé + polish** : ✅ Organization + WebSite JSON-LD
  sitewide, `og:type=article` + `article:published_time` / `modified_time`
  / `article:tag` sur les pages article, `og:image` par défaut auto-hébergé
  (SVG éditorial 1200×630), sitemap enrichi (lastmod, changefreq, priority
  par type de route), `hreflang fr-MA` + `x-default`, `apple-touch-icon`,
  `site.webmanifest`, `humans.txt`, `.well-known/security.txt`, `robots.txt`
  actualisé (bloque `/design-system/`), déduplication du suffixe de titre.

- **Phase 8 — Audit final + prod-ready** : ✅ `.env.example`,
  `public/_headers` (HSTS + CSP + cache immutable pour `/_astro/` et
  `/fonts/`), `public/_redirects`, GitHub Actions CI
  (`check` + `lint` + `test` + `build`, artifact `dist/` 7 jours),
  guide de déploiement Cloudflare Pages / Netlify / Vercel
  (`docs/DEPLOYMENT.md`), rapport d'audit accessibilité + performance +
  sécurité + privacy + SEO (`docs/AUDIT.md`), champ `engines.node ≥ 22`.

**Statut : prêt pour la production.**

- **Phase 9 — Pipeline de contenu assisté par IA** : ✅ script
  `scripts/generate-article.mjs` (Node natif, aucune dépendance npm),
  intégration Gemini 2.0 Flash (tier gratuit 1 500 req/jour), file
  d'idées `content-ideas.json`, workflow GitHub Actions
  `generate-article.yml` (cron lun/mer/ven + dispatch manuel), ouverture
  automatique de PR avec labels `ai-draft` + `needs-review`, garde-fous
  (draft: true systématique, `astro check` avant PR, revue humaine
  obligatoire). Documentation dans `docs/AI_WORKFLOW.md`. Trois vrais
  articles éditoriaux (~1000 mots chacun) livrés en `.mdx` pour
  démarrer la publication.

## Page de validation interne

`/design-system/` — présente l'ensemble du système visuel (tokens,
typographie, boutons, formulaires, cards, article cards, icônes, callouts,
nombres financiers). Marquée `noindex` et exclue du sitemap.
