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
      exclude: [
        // Legacy SEO redirect stubs — canonical content lives under /experience/ and /credentials/
        'aws-solutions-architect-professional',
        'github-actions',
        'bimodal',
        'codyops',
        'jenkins-migration-github-argocd',
      ],
    }),
  ],
  redirects: {
   '/aws-solutions-architect-professional/': '/credentials/aws-solutions-architect-professional/',

   '/github-actions/': '/credentials/github-actions/',

   '/bimodal/': '/experience/bimodal/',

   '/codyops/': '/experience/codyops/',

   '/jenkins-migration-github-argocd/': '/experience/jenkins-migration-github-argocd/',
  },
});
