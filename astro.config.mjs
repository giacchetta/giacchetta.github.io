import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import llms, { DEFAULT_NOISE_SELECTORS } from 'astro-llms-md';

// https://astro.build/config
export default defineConfig({
  site: 'https://lucianogiacchetta.com',
  integrations: [
    mdx(),
    sitemap(),
    llms({
      contentSelector: 'main',
      excludeSelectors: [...DEFAULT_NOISE_SELECTORS],
      exclude: [],
    }),
  ],
  redirects: {},
});
