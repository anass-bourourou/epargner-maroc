import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

// -----------------------------------------------------------------------------
// Épargner Maroc — Content collections
// French-first content. Structured for future locale expansion (fr/ar).
// -----------------------------------------------------------------------------

const CATEGORIES = [
  'epargne',
  'banques',
  'assurances',
  'credit',
  'investissement',
  'guides',
  'outils',
] as const;

const authors = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/authors' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      role: z.string().optional(),
      bio: z.string().optional(),
      avatar: image().optional(),
      links: z
        .object({
          website: z.string().url().optional(),
          linkedin: z.string().url().optional(),
          twitter: z.string().url().optional(),
        })
        .optional(),
    }),
});

const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(4),
      description: z.string().min(20).max(300),
      category: z.enum(CATEGORIES),
      tags: z.array(z.string()).default([]),
      author: reference('authors').optional(),
      publishedAt: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),
      readingTime: z.number().int().positive().optional(),
      heroImage: image().optional(),
      heroImageAlt: z.string().optional(),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
      /** Marks an article auto-generated + auto-published via the AI pipeline. */
      aiGenerated: z.boolean().default(false),
      /** Reviewer signals: filled by the critic pass (score 0-100, main risks). */
      aiReview: z
        .object({
          score: z.number().int().min(0).max(100).optional(),
          notes: z.array(z.string()).default([]),
          reviewedAt: z.coerce.date().optional(),
        })
        .optional(),
      sources: z
        .array(
          z.object({
            label: z.string(),
            url: z.string().url().optional(),
            publisher: z.string().optional(),
            accessedAt: z.coerce.date().optional(),
          }),
        )
        .default([]),
      seo: z
        .object({
          title: z.string().optional(),
          description: z.string().optional(),
          canonical: z.string().url().optional(),
          noindex: z.boolean().default(false),
        })
        .optional(),
    }),
});

const guides = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/guides' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      category: z.enum(CATEGORIES),
      author: reference('authors').optional(),
      publishedAt: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),
      heroImage: image().optional(),
      chapters: z
        .array(
          z.object({
            title: z.string(),
            anchor: z.string(),
          }),
        )
        .default([]),
      draft: z.boolean().default(false),
    }),
});

export const collections = { articles, guides, authors };
export const ARTICLE_CATEGORIES = CATEGORIES;
export type ArticleCategory = (typeof CATEGORIES)[number];
