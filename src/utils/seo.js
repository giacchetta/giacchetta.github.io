export const SITE = import.meta.env.SITE.replace(/\/$/, '');
const PERSON_ID = `${SITE}/#person`;

/** ISO-8601 string for a Date (or date-like) value, or undefined if absent. */
function toISO(value) {
  return value ? new Date(value).toISOString() : undefined;
}

/**
 * Inline author/publisher reference. Google resolves each page on its own, so
 * a bare `{ "@id": ... }` pointing at the Person node that only lives in the
 * home page's graph leaves the author without a name on every other page —
 * carry `name` and `url` alongside the `@id`.
 */
function personRef() {
  return { '@type': 'Person', '@id': PERSON_ID, name: 'Luciano Giacchetta', url: SITE };
}

/**
 * The site's single canonical Person node. Referenced by @id from every other
 * node (WebSite.publisher, BlogPosting.author, TechArticle.author) so crawlers
 * resolve them all to the same entity instead of duplicating Person data.
 */
export function personNode({ jobTitle, brand, sameAs = [], worksFor = [], knowsAbout = [] }) {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: 'Luciano Giacchetta',
    alternateName: brand,
    url: SITE,
    image: `${SITE}/og.png`,
    jobTitle,
    sameAs,
    ...(worksFor.length ? { worksFor } : {}),
    ...(knowsAbout.length ? { knowsAbout } : {}),
  };
}

/**
 * Home-page structured data: Person + WebSite + ProfilePage as a single
 * @graph so they share one <script> block and resolve against one @context.
 */
export function homeGraph({ jobTitle, brand, sameAs, worksFor, knowsAbout, description }) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      personNode({ jobTitle, brand, sameAs, worksFor, knowsAbout }),
      {
        '@type': 'WebSite',
        '@id': `${SITE}/#website`,
        url: SITE,
        name: 'Luciano Giacchetta',
        publisher: { '@id': PERSON_ID },
      },
      {
        '@type': 'ProfilePage',
        '@id': `${SITE}/#profile`,
        url: SITE,
        description,
        mainEntity: { '@id': PERSON_ID },
      },
    ],
  };
}

/**
 * BreadcrumbList from the same `{ label, href? }[]` shape already built by
 * page components for the visible Bootstrap breadcrumb. The last item
 * (current page) is expected to omit `href`, matching schema.org guidance
 * that the final crumb's `item` URL may be left out.
 */
export function breadcrumbList(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${SITE}${item.href}` } : {}),
    })),
  };
}

/** Structured data for a blog permalink. */
export function blogPosting({ title, description, datePublished, dateModified, tags, url, image }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    datePublished: toISO(datePublished),
    dateModified: toISO(dateModified) ?? toISO(datePublished),
    author: personRef(),
    publisher: personRef(),
    keywords: tags?.length ? tags.join(', ') : undefined,
    image,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };
}

/**
 * Structured data for a case study or credential/certification deep-dive.
 * `keywords`/`about` are populated on case studies from their resolved
 * tech_stack (see src/utils/skills.js) and omitted when empty.
 */
export function techArticle({ title, description, datePublished, dateModified, url, keywords = [], about = [] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: title,
    description,
    datePublished: toISO(datePublished),
    dateModified: toISO(dateModified),
    author: personRef(),
    publisher: personRef(),
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    keywords: keywords.length ? keywords.join(', ') : undefined,
    about: about.length ? about.map((name) => ({ '@type': 'Thing', name })) : undefined,
  };
}

/** Structured data for a software project page (e.g. /ansina/). */
export function softwareSourceCode({ name, description, url, codeRepository, programmingLanguage }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name,
    description,
    url,
    codeRepository,
    programmingLanguage,
    author: personRef(),
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };
}
