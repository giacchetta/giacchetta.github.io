const SITE = 'https://lucianogiacchetta.com';
const PERSON_ID = `${SITE}/#person`;

/** ISO-8601 string for a Date (or date-like) value, or undefined if absent. */
function toISO(value) {
  return value ? new Date(value).toISOString() : undefined;
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
    author: { '@id': PERSON_ID },
    publisher: { '@id': PERSON_ID },
    keywords: tags?.length ? tags.join(', ') : undefined,
    image,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };
}

/** Structured data for a case study or credential/certification deep-dive. */
export function techArticle({ title, description, datePublished, dateModified, url }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: title,
    description,
    datePublished: toISO(datePublished),
    dateModified: toISO(dateModified),
    author: { '@id': PERSON_ID },
    publisher: { '@id': PERSON_ID },
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };
}
