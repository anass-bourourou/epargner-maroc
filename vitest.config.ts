import { defineConfig } from 'vitest/config';

// Minimal, isolated from astro.config so vitest doesn't try to load MDX/Astro.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: false,
  },
});
