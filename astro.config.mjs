// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://epargner-maroc.com',
  // French-first. Additional locales (Arabic, ...) added later without rewrite.
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    mdx(),
    react(),
    sitemap({
      // Exclude internal / noindex routes.
      filter: (page) => !page.includes('/design-system'),
      // Section-specific hints for crawlers.
      serialize(item) {
        const u = item.url;
        if (u.match(/\/articles\/[^/]+\/$/)) {
          item.changefreq = 'monthly';
          item.priority = 0.7;
        } else if (u.match(/\/guides\/[^/]+\/$/)) {
          item.changefreq = 'monthly';
          item.priority = 0.7;
        } else if (u.endsWith('/articles/') || u.endsWith('/guides/')) {
          item.changefreq = 'weekly';
          item.priority = 0.6;
        } else if (u.match(/\/(epargne|banques|assurances|credit|investissement|outils)\/$/)) {
          item.changefreq = 'weekly';
          item.priority = 0.8;
        } else if (u === 'https://epargner-maroc.com/') {
          item.changefreq = 'weekly';
          item.priority = 1.0;
        } else {
          item.changefreq = 'monthly';
          item.priority = 0.5;
        }
        item.lastmod = new Date().toISOString();
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    // Emit standard file/dir structure
    format: 'directory',
  },
  compressHTML: true,
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
});
