import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import llms, { DEFAULT_NOISE_SELECTORS } from 'astro-llms-md';

const contentDir = fileURLToPath(new URL('./src/content/', import.meta.url));

/** First `key: value` date (YYYY-MM-DD, quoted or not) found in frontmatter, for the given keys in priority order. */
function frontmatterDate(filePath, keys) {
  const raw = readFileSync(filePath, 'utf-8');
  const frontmatter = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  for (const key of keys) {
    const match = frontmatter.match(new RegExp(`^${key}:\\s*"?(\\d{4}-\\d{2}-\\d{2})`, 'm'));
    if (match) return match[1];
  }
  return null;
}

/**
 * Maps each built route to a `lastmod` date read straight from content
 * frontmatter, so the sitemap can carry freshness hints without needing the
 * async `astro:content` API (unavailable this early in the config).
 */
function buildLastmodMap() {
  const map = new Map();

  const blogDir = path.join(contentDir, 'blog');
  for (const file of readdirSync(blogDir)) {
    if (!/\.mdx?$/.test(file)) continue;
    const full = path.join(blogDir, file);
    const slug = readFileSync(full, 'utf-8').match(/^slug:\s*"?([\w-]+)"?/m)?.[1];
    const id = slug ?? file.replace(/\.mdx?$/, '');
    const date = frontmatterDate(full, ['date']);
    if (date) map.set(`/blog/${id}/`, date);
  }

  // Both `credentials` and `certifications` route under /credentials/[slug]/.
  for (const [collection, routePrefix] of [
    ['collaborations', 'experience'],
    ['credentials', 'credentials'],
    ['certifications', 'credentials'],
  ]) {
    const dir = path.join(contentDir, collection);
    let files;
    try {
      files = readdirSync(dir);
    } catch {
      continue;
    }
    for (const file of files) {
      if (!/\.mdx?$/.test(file)) continue;
      const full = path.join(dir, file);
      const id = file.replace(/\.mdx?$/, '');
      const date = frontmatterDate(full, ['updateDate', 'publishDate']);
      if (date) map.set(`/${routePrefix}/${id}/`, date);
    }
  }

  return map;
}

const lastmodMap = buildLastmodMap();
const sectionIndexPriority = new Set(['/blog/', '/experience/', '/credentials/']);

// https://astro.build/config
export default defineConfig({
  site: 'https://lucianogiacchetta.com',
  integrations: [
    mdx(),
    sitemap({
      serialize(item) {
        const { pathname } = new URL(item.url);
        const lastmod = lastmodMap.get(pathname);
        const isBlogPost = pathname.startsWith('/blog/') && pathname !== '/blog/';
        return {
          ...item,
          ...(lastmod ? { lastmod } : {}),
          changefreq: pathname === '/' ? 'weekly' : isBlogPost ? 'yearly' : 'monthly',
          priority: pathname === '/' ? 1.0 : sectionIndexPriority.has(pathname) ? 0.8 : isBlogPost ? 0.7 : 0.6,
        };
      },
    }),
    llms({
      contentSelector: 'main',
      excludeSelectors: [...DEFAULT_NOISE_SELECTORS],
      exclude: [],
    }),
  ],
  redirects: {},
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
  },
});
