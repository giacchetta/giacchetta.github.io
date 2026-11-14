// Helpers for the /ansina/ page, whose content is the giacchetta/ansina README
// fetched at build time (see the `ansina` collection in src/content.config.ts).

export const ANSINA_REPO_URL = 'https://github.com/giacchetta/ansina';
export const ANSINA_README_URL = 'https://raw.githubusercontent.com/giacchetta/ansina/main/README.md';

const BLOB_BASE = `${ANSINA_REPO_URL}/blob/main/`;
const RAW_BASE = 'https://raw.githubusercontent.com/giacchetta/ansina/main/';

const isAbsolute = (target) => /^([a-z][a-z0-9+.-]*:|#|\/\/|\/)/i.test(target);
const clean = (target) => target.replace(/^\.\//, '');

/** Visible text description of the README's architecture diagram (the diagram itself is drawn client-side, so crawlers would otherwise only see its source). */
export const ANSINA_DIAGRAM_CAPTION =
  'Request flow: a client (the TUI, curl or a browser) authenticates with a bearer token and role checks, then calls the REST API. The API reads and writes SQLite and drives the Heart\u2019s tick loop, which can optionally escalate a decision to the remote Brain.';

/** True for blog posts generated from (or about) the Ansina project. */
export const isAnsinaPost = (post) =>
  /\/giacchetta\/ansina\//.test(post.data.pr ?? '') || /ansina/i.test(post.data.title);

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Adapts the README for this site: rewrites repo-relative links/images to
 * absolute GitHub URLs, and turns ```mermaid fences into <pre class="mermaid">
 * blocks that mermaid.js renders in the browser.
 */
export function prepareReadme(md) {
  // Split out fenced blocks so link rewriting never touches code samples.
  const parts = md.split(/(^```[^\n]*\n[\s\S]*?^```[ \t]*$)/m);
  return parts
    .map((part, i) => {
      if (i % 2 === 1) {
        const m = part.match(/^```mermaid[ \t]*\n([\s\S]*?)\n```[ \t]*$/);
        return m
          ? `<figure class="mermaid-figure">\n<pre class="mermaid">${escapeHtml(m[1].replace(/\n\s*\n/g, '\n'))}</pre>\n<figcaption class="small text-muted text-center">${ANSINA_DIAGRAM_CAPTION}</figcaption>\n</figure>`
          : part;
      }
      return part
        .replace(/(!\[[^\]]*\]\()([^)\s]+)/g, (all, pre, target) =>
          isAbsolute(target) ? all : `${pre}${RAW_BASE}${clean(target)}`
        )
        .replace(/((?<!!)\[[^\]]*\]\()([^)\s]+)/g, (all, pre, target) =>
          isAbsolute(target) ? all : `${pre}${BLOB_BASE}${clean(target)}`
        );
    })
    .join('');
}
