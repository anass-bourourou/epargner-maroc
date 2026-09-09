// -----------------------------------------------------------------------------
// JSON-LD helpers. Only emit fields the site actually knows.
// -----------------------------------------------------------------------------

import type { Article } from './articles';

const SITE_NAME = 'Épargner Maroc';

export function organizationSchema(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: siteUrl,
    logo: `${siteUrl.replace(/\/$/, '')}/favicon.svg`,
  };
}

export function websiteSchema(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: siteUrl,
    inLanguage: 'fr-MA',
  };
}

export interface BreadcrumbItem {
  name: string;
  href: string;
}

export function breadcrumbListSchema(
  siteUrl: string,
  items: BreadcrumbItem[],
) {
  const base = siteUrl.replace(/\/$/, '');
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${base}${it.href}`,
    })),
  };
}

export function articleSchema(
  siteUrl: string,
  article: Article,
  authorName: string | undefined,
) {
  const base = siteUrl.replace(/\/$/, '');
  const url = `${base}/articles/${article.id}/`;
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.data.title,
    description: article.data.description,
    url,
    mainEntityOfPage: url,
    datePublished: article.data.publishedAt.toISOString(),
    inLanguage: 'fr-MA',
    isAccessibleForFree: true,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${base}/favicon.svg` },
    },
  };
  if (article.data.updatedAt) {
    schema.dateModified = article.data.updatedAt.toISOString();
  }
  if (authorName) {
    schema.author = { '@type': 'Person', name: authorName };
  }
  return schema;
}
