import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPublishedArticles, articleHref } from '../lib/articles';
import { categoryMeta } from '../lib/categories';

export async function GET(context: APIContext) {
  const articles = await getPublishedArticles();
  return rss({
    title: 'Épargner Maroc',
    description:
      'Publication indépendante de finance personnelle au Maroc — épargne, banques, assurances, crédit, investissement.',
    site: context.site ?? 'https://epargnermaroc.ma',
    items: articles.map((a) => ({
      title: a.data.title,
      description: a.data.description,
      pubDate: a.data.publishedAt,
      link: articleHref(a),
      categories: [categoryMeta(a.data.category).label],
    })),
    customData: `<language>fr-MA</language>`,
    stylesheet: false,
  });
}
