import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  integrations: [mdx()],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es-ar', 'es-uy'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
