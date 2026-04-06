import { getCollection } from 'astro:content';

// Astro v5 ids include the file extension (e.g. "telnyx.es-ar.mdx")
const localeIdPattern = /\.(es-ar|es-uy)\.\w+$/;
// Astro v5 slugs have dots removed (e.g. "telnyxes-ar"), so we derive clean slugs from id

function stripLocaleFromId(id) {
  return id.replace(/\.(es-ar|es-uy)(\.\w+)$/, '$2');
}

function filterByLocale(entries, locale) {
  if (!locale || locale === 'en') {
    return entries.filter(e => !localeIdPattern.test(e.id));
  }
  const localeSuffix = `.${locale}.`;
  const localeEntries = entries.filter(e => e.id.includes(localeSuffix));
  // Fallback to English for entries without a translation
  const translatedBaseIds = new Set(localeEntries.map(e => stripLocaleFromId(e.id)));
  const fallbacks = entries.filter(e => !localeIdPattern.test(e.id) && !translatedBaseIds.has(e.id));
  return [...localeEntries, ...fallbacks];
}

export async function getAllPages(locale) {
  const credentials = await getCollection('credentials');
  const collaborations = await getCollection('collaborations');
  const certifications = await getCollection('certifications');

  const sortFn = (a, b) => {
    if (a.data.featured && !b.data.featured) return -1;
    if (!a.data.featured && b.data.featured) return 1;
    return a.data.title.localeCompare(b.data.title);
  };

  return {
    credentials: filterByLocale(credentials, locale).sort(sortFn),
    collaborations: filterByLocale(collaborations, locale).sort(sortFn),
    certifications: filterByLocale(certifications, locale).sort(sortFn),
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

/** Derive a clean slug from the entry's id (strips locale suffix and extension) */
export function cleanSlug(entry) {
  return entry.id.replace(/\.(es-ar|es-uy)\.\w+$/, '').replace(/\.\w+$/, '');
}
