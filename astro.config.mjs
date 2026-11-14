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
  // Section indexes have no frontmatter of their own: their lastmod is the
  // newest date among the entries they list (ISO dates compare as strings).
  const newest = new Map();
  const bump = (route, date) => {
    if (date && (!newest.get(route) || date > newest.get(route))) newest.set(route, date);
  };

  const blogDir = path.join(contentDir, 'blog');
  for (const file of readdirSync(blogDir)) {
    if (!/\.mdx?$/.test(file)) continue;
    const full = path.join(blogDir, file);
    const slug = readFileSync(full, 'utf-8').match(/^slug:\s*"?([\w-]+)"?/m)?.[1];
    const id = slug ?? file.replace(/\.mdx?$/, '');
    const date = frontmatterDate(full, ['date']);
    if (date) {
      map.set(`/blog/${id}/`, date);
      bump('/blog/', date);
      bump('/', date); // the home page lists the latest posts
      // /ansina/ is built from a remote README; the newest Ansina post is the
      // closest local proxy for when the project last changed.
      const raw = readFileSync(full, 'utf-8');
      if (/^pr:.*\/giacchetta\/ansina\//m.test(raw) || /^title:.*ansina/im.test(raw)) bump('/ansina/', date);
    }
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
      if (date) {
        map.set(`/${routePrefix}/${id}/`, date);
        bump(`/${routePrefix}/`, date);
      }
    }
  }

  for (const [route, date] of newest) map.set(route, date);

  return map;
}

const lastmodMap = buildLastmodMap();
const sectionIndexPriority = new Set(['/blog/', '/experience/', '/credentials/']);

// https://astro.build/config
export default defineConfig({
  site: 'https://luciano.giacchetta.com.ar',
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
