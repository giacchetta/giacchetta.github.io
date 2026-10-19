import credentialsData from '../data/credentials.json';
import { cleanSlug, getAllPages } from './content.js';

/**
 * The single reader of `src/data/credentials.json`. Every consumer (the
 * credentials matrix, the home Bento tiles, the case-study tech_stack badges,
 * and the content-collection schema check) goes through this module instead
 * of importing the JSON directly, so the "id is the skill's identity" contract
 * lives in exactly one place.
 */

let _index = null;

/**
 * `Map<id, { ...entry, category }>`, built once from the JSON import and
 * cached for the life of the module. Throws on a duplicate `id` so the
 * uniqueness convention can't silently rot as entries are added.
 */
export function skillIndex() {
  if (_index) return _index;

  const index = new Map();
  for (const [category, entries] of Object.entries(credentialsData)) {
    for (const entry of entries) {
      if (index.has(entry.id)) {
        throw new Error(
          `Duplicate credentials.json id "${entry.id}" (category "${category}") — ids must be unique.`
        );
      }
      index.set(entry.id, { ...entry, category });
    }
  }

  _index = index;
  return index;
}

/** `Set<string>` of every known skill id — consumed by the schema's build-time check. */
export function skillIds() {
  return new Set(skillIndex().keys());
}

/** The resolved entry for a single id, or `undefined` if unknown. */
export function resolveSkill(id) {
  return skillIndex().get(id);
}

/**
 * Resolved entries for an array of ids, de-duplicated and order-preserving.
 * Needed because multiple tech_stack ids can collapse onto the same entry
 * (e.g. "Helm" and "Kustomize" both resolve to `helm-kustomize`). Unknown ids
 * are silently skipped here — the content-collection schema is what fails the
 * build on those, so by the time this runs every id is expected to be valid.
 */
export function resolveSkills(ids = []) {
  const seen = new Set();
  const resolved = [];
  for (const id of ids) {
    const entry = resolveSkill(id);
    if (entry && !seen.has(entry.id)) {
      seen.add(entry.id);
      resolved.push(entry);
    }
  }
  return resolved;
}

/** The badge-friendly short name for an entry: `label` if set, else `name`. */
export function skillLabel(entry) {
  return entry.label ?? entry.name;
}

/**
 * Link target for a skill badge: the deep-dive page when the entry names a
 * `credentialPage` that actually exists as a published page, else an anchor
 * into the full `/credentials/` matrix.
 */
export function skillHref(entry, credentialSlugs) {
  if (entry.credentialPage && credentialSlugs.has(entry.credentialPage)) {
    return `/credentials/${entry.credentialPage}/`;
  }
  return `/credentials/#${entry.id}`;
}

/**
 * Reverse index: the published case-study (`type: "article"`) entries whose
 * tech_stack includes the given skill id — direct, id-to-id matching with no
 * dependency on a deep-dive page existing. This is what makes the full
 * `/credentials/` matrix able to link back to a case study for *any*
 * referenced skill, not only the couple with a `credentialPage`.
 */
export function caseStudiesForSkillId(id, collaborations) {
  return collaborations.filter(
    (entry) => entry.data.type === 'article' && (entry.data.tech_stack ?? []).includes(id)
  );
}

/**
 * Reverse index for a credential/certification deep-dive page: every
 * published case study that uses any skill whose `credentialPage` is `slug`
 * (normally exactly one skill id, but this unions over all matches and
 * de-dupes in case more than one id ever points at the same page).
 */
export function caseStudiesForCredential(slug, collaborations) {
  const ids = [...skillIndex().values()]
    .filter((entry) => entry.credentialPage === slug)
    .map((entry) => entry.id);

  const seen = new Set();
  const results = [];
  for (const id of ids) {
    for (const article of caseStudiesForSkillId(id, collaborations)) {
      if (!seen.has(article.id)) {
        seen.add(article.id);
        results.push(article);
      }
    }
  }
  return results;
}

/** `[{ title, entries }]` per category, for the full skills matrix. */
export function skillSections() {
  return Object.entries(credentialsData).map(([title, entries]) => ({ title, entries }));
}

/** Deduped `product` names across every category, for the home Tile 4 badges. */
export function skillProducts() {
  return [...new Set(Object.values(credentialsData).flat().map((entry) => entry.product))];
}

/** Flat `name` list across every category, for `Person.knowsAbout` JSON-LD. */
export function skillNames() {
  return Object.values(credentialsData).flat().map((entry) => entry.name);
}

/**
 * `[{ slug, count }]` per category — the `kubectl get skills`-style rows in
 * the home Tile 1 `~/stack` pane.
 */
export function skillDomains() {
  return Object.entries(credentialsData).map(([name, entries]) => ({
    slug: name.toLowerCase().replace(/\s*&\s*/g, '-').replace(/\s+/g, '-'),
    count: entries.length,
  }));
}

/** The set of published credential-collection slugs, for `skillHref`'s existence check. */
export async function credentialSlugSet() {
  const allPages = await getAllPages();
  return new Set(allPages.credentials.map((p) => cleanSlug(p)));
}
