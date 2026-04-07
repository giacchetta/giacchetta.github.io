import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://lucianogiacchetta.com',
  integrations: [mdx(), sitemap({ i18n: { defaultLocale: 'en', locales: { en: 'en', 'es-ar': 'es-AR', 'es-uy': 'es-UY' } } })],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es-ar', 'es-uy'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
