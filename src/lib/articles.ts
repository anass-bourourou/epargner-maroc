// -----------------------------------------------------------------------------
// Article & guide collection helpers.
// -----------------------------------------------------------------------------

import { getCollection, type CollectionEntry } from 'astro:content';
import type { ArticleCategory } from '../content.config';

export type Article = CollectionEntry<'articles'>;
export type Guide = CollectionEntry<'guides'>;
export type Author = CollectionEntry<'authors'>;

const isProd = import.meta.env.PROD;

/**
 * Drafts are excluded in production builds but visible in dev — makes it
 * easy to work on unpublished content locally without changing frontmatter.
 */
function publicFilter<T extends { data: { draft?: boolean } }>(entry: T): boolean {
  return isProd ? !entry.data.draft : true;
}

/** All published articles, newest first. */
export async function getPublishedArticles(): Promise<Article[]> {
  const all = await getCollection('articles', (entry: Article) => publicFilter(entry));
  return all.sort(
    (a: Article, b: Article) =>
      b.data.publishedAt.getTime() - a.data.publishedAt.getTime(),
  );
}

/** Published articles in a given category, newest first. */
export async function getArticlesByCategory(
  category: ArticleCategory,
): Promise<Article[]> {
  const all = await getPublishedArticles();
  return all.filter((a) => a.data.category === category);
}

/** Featured first, then most recent. */
export async function getFeaturedArticles(limit?: number): Promise<Article[]> {
  const all = await getPublishedArticles();
  const featured = all.filter((a) => a.data.featured);
  const rest = all.filter((a) => !a.data.featured);
  const result = [...featured, ...rest];
  return limit ? result.slice(0, limit) : result;
}

/**
 * Deterministic related-article selection.
 * Priority: same category → shared tags → recency. Excludes current entry.
 */
export async function getRelatedArticles(
  current: Article,
  limit = 3,
): Promise<Article[]> {
  const all = await getPublishedArticles();
  const candidates = all.filter((a) => a.id !== current.id);
  const currentTags = new Set(current.data.tags);

  const scored = candidates.map((a) => {
    const sameCategory = a.data.category === current.data.category ? 1 : 0;
    const sharedTags = (a.data.tags as string[]).filter((t) =>
      currentTags.has(t),
    ).length;
    // Recency provides a stable tiebreaker; older wins less
    const ageDays = Math.max(
      1,
      Math.floor(
        (Date.now() - a.data.publishedAt.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );
    const score = sameCategory * 100 + sharedTags * 10 - Math.log(ageDays);
    return { entry: a, score };
  });

  scored.sort((x, y) => y.score - x.score);
  return scored.slice(0, limit).map((s) => s.entry);
}

/** Published guides, newest first. */
export async function getPublishedGuides(): Promise<Guide[]> {
  const all = await getCollection('guides', (entry: Guide) => publicFilter(entry));
  return all.sort(
    (a: Guide, b: Guide) =>
      b.data.publishedAt.getTime() - a.data.publishedAt.getTime(),
  );
}

/** Guides for a category. */
export async function getGuidesByCategory(
  category: ArticleCategory,
): Promise<Guide[]> {
  const all = await getPublishedGuides();
  return all.filter((g) => g.data.category === category);
}

export function articleHref(article: Article): string {
  return `/articles/${article.id}/`;
}

export function guideHref(guide: Guide): string {
  return `/guides/${guide.id}/`;
}

/**
 * Approximate reading time (French average ≈ 200 words / min).
 * Falls back to the manually-set `readingTime` field when present.
 */
export function estimateReadingMinutes(
  bodyText: string | undefined,
  fallback?: number,
): number {
  if (fallback && fallback > 0) return fallback;
  if (!bodyText) return 0;
  const words = bodyText.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}
