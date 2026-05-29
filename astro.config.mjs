import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import llms, { DEFAULT_NOISE_SELECTORS } from 'astro-llms-md';

// https://astro.build/config
export default defineConfig({
  site: 'https://lucianogiacchetta.com',
  integrations: [
    mdx(),
    sitemap({ i18n: { defaultLocale: 'en', locales: { en: 'en', 'es-ar': 'es-AR', 'es-uy': 'es-UY' } } }),
    llms({
      contentSelector: 'main',
      excludeSelectors: [...DEFAULT_NOISE_SELECTORS],
      exclude: [
        // Legacy SEO redirect stubs — canonical content lives under /experience/ and /credentials/
        'aws-solutions-architect-professional', 'es-ar/aws-solutions-architect-professional', 'es-uy/aws-solutions-architect-professional',
        'github-actions', 'es-ar/github-actions', 'es-uy/github-actions',
        'bimodal', 'es-ar/bimodal', 'es-uy/bimodal',
        'codyops', 'es-ar/codyops', 'es-uy/codyops',
        'jenkins-migration-github-argocd', 'es-ar/jenkins-migration-github-argocd', 'es-uy/jenkins-migration-github-argocd',
      ],
    }),
  ],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es-ar', 'es-uy'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  redirects: {
   '/aws-solutions-architect-professional/': '/credentials/aws-solutions-architect-professional/',
   '/es-ar/aws-solutions-architect-professional/': '/es-ar/credentials/aws-solutions-architect-professional/',
   '/es-uy/aws-solutions-architect-professional/': '/es-uy/credentials/aws-solutions-architect-professional/',
   
   '/github-actions/': '/credentials/github-actions/',
   '/es-ar/github-actions/': '/es-ar/credentials/github-actions/',
   '/es-uy/github-actions/': '/es-uy/credentials/github-actions/',
   
   '/bimodal/': '/experience/bimodal/',
   '/es-ar/bimodal/': '/es-ar/experience/bimodal/',
   '/es-uy/bimodal/': '/es-uy/experience/bimodal/',
   
   '/codyops/': '/experience/codyops/',
   '/es-ar/codyops/': '/es-ar/experience/codyops/',
   '/es-uy/codyops/': '/es-uy/experience/codyops/',
   
   '/jenkins-migration-github-argocd/': '/experience/jenkins-migration-github-argocd/',
   '/es-ar/jenkins-migration-github-argocd/': '/es-ar/experience/jenkins-migration-github-argocd/',
   '/es-uy/jenkins-migration-github-argocd/': '/es-uy/experience/jenkins-migration-github-argocd/',
  },	
});
