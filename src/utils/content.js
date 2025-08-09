import { getCollection } from 'astro:content';

export async function getAllPages() {
  const credentials = await getCollection('credentials');
  const collaborations = await getCollection('collaborations');
  const certifications = await getCollection('certifications');
  
  return {
    credentials: credentials.sort((a, b) => {
      if (a.data.featured && !b.data.featured) return -1;
      if (!a.data.featured && b.data.featured) return 1;
      return a.data.title.localeCompare(b.data.title);
    }),
    collaborations: collaborations.sort((a, b) => {
      if (a.data.featured && !b.data.featured) return -1;
      if (!a.data.featured && b.data.featured) return 1;
      return a.data.title.localeCompare(b.data.title);
    }),
    certifications: certifications.sort((a, b) => {
      if (a.data.featured && !b.data.featured) return -1;
      if (!a.data.featured && b.data.featured) return 1;
      return a.data.title.localeCompare(b.data.title);
    }),
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
    const nonFeatured = categoryPages.filter(page => page.data.featured !== true);
    allNonFeatured.push(...nonFeatured);
  });
  return allNonFeatured;
}
