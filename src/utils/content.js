import { getCollection } from 'astro:content';

/**
 * Locale filtering is no longer needed (English-only site). Kept as a no-op
 * so existing callers can be migrated incrementally.
 */
export function filterByLocale(entries) {
  return entries;
}

export async function getAllPages() {
  const credentials = (await getCollection('credentials')).filter(p => !p.data.draft);
  const collaborations = (await getCollection('collaborations')).filter(p => !p.data.draft);
  const certifications = (await getCollection('certifications')).filter(p => !p.data.draft);

  const sortFn = (a, b) => {
    if (a.data.featured && !b.data.featured) return -1;
    if (!a.data.featured && b.data.featured) return 1;
    return a.data.title.localeCompare(b.data.title);
  };

  return {
    credentials: filterByLocale(credentials).sort(sortFn),
    collaborations: filterByLocale(collaborations).sort(sortFn),
    certifications: filterByLocale(certifications).sort(sortFn),
  };
}

export async function getBlogPosts() {
  return (await getCollection('blog'))
    .filter(p => !p.data.draft)
    .sort((a, b) => new Date(b.data.date) - new Date(a.data.date));
}

export function getPagesByCategory(pages, category) {
  return pages[category] || [];
}

export function getFeaturedPagesByCategory(pages, category) {
  const categoryPages = pages[category] || [];
  return categoryPages.filter(page => page.data.featured === true);
}

export function getNonFeaturedPagesByCategory(pages, category) {
  const categoryPages = pages[category] || [];
  return categoryPages.filter(page => page.data.featured !== true);
}

export function getAllNonFeaturedPages(pages) {
  const allNonFeatured = [];
  Object.values(pages).forEach(categoryPages => {
    const nonFeatured = categoryPages.filter(
      page => page.data.featured !== true && page.data.type !== 'company'
    );
    allNonFeatured.push(...nonFeatured);
  });
  return allNonFeatured;
}

/** Derive the URL slug from the entry's id. */
export function cleanSlug(entry) {
  return entry.id;
}

/**
 * Fallback meta description for a blog post that has no frontmatter
 * `description`, so it never inherits the site-wide default (which would
 * otherwise duplicate the homepage's <meta name="description"> across every
 * post). Strips Markdown syntax from the raw body and truncates at a word
 * boundary.
 */
export function getExcerpt(entry, maxLength = 155) {
  const plain = (entry.body || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~]/g, '')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (plain.length <= maxLength) return plain;
  const truncated = plain.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : maxLength)}…`;
}
