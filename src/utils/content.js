import { getCollection } from 'astro:content';

/**
 * Locale filtering is no longer needed (English-only site). Kept as a no-op
 * so existing callers can be migrated incrementally.
 */
export function filterByLocale(entries) {
  return entries;
}

export async function getAllPages() {
  const credentials = await getCollection('credentials');
  const collaborations = await getCollection('collaborations');
  const certifications = await getCollection('certifications');

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
