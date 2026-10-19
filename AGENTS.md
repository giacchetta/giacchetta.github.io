# AGENTS.md

> **Mandatory**: After every change to the project (features added, removed, or modified), update this file (AGENTS.md) and README.md to reflect the current state. Do not leave either file stale. Do not commit code.

---

## What this project is

A professional portfolio site for Luciano Giacchetta, a DevOps/Cloud/Systems Engineer. It is a statically generated, **English-only** site built with **Astro 7** and deployed to Cloudflare Pages.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Astro 7.x with MDX integration |
| Styling | Bootstrap 5.3 - Keep custom CSS to an absolute minimum |
| CSS Optimization | PurgeCSS (strips unused Bootstrap at build time) |
| Content | Astro Content Collections with Zod schemas, MDX/Markdown files |
| UI strings | `src/i18n/en.json` (single English dictionary) |
| Sitemap | `@astrojs/sitemap` |
| Agent/LLM access | `astro-llms-md` — per-page `.md` files + `/llms.txt` + `/llms-full.txt` |
| Deployment | Cloudflare Pages (git-connected, builds on push to `main`) |

**CSS Rule**: Only use Bootstrap 5.3 classes. Do not introduce any other CSS framework or large custom stylesheets.

---

## Architecture Overview

### Directory Structure

```
src/
├── assets/img/              # Images and logos (PNG/SVG) imported in MDX and components
├── assets/svg/              # Icon SVGs (brand marks + phone) imported via `?raw` and inlined with set:html in HomePage.astro (whatsapp.svg is the WhatsApp glyph used on the contact icon row — do not confuse with a full "Chat on WhatsApp" button asset)
├── components/              # All UI components (Astro components only)
├── content/                 # MD/MDX content collections
│   ├── blog/                # Blog posts (Markdown, auto-generated + manual)
│   ├── certifications/      # Certification entries
│   ├── collaborations/      # Company and article entries
│   └── credentials/         # Technical skill deep-dives
├── data/                    # credentials.json (skills grid data)
├── i18n/
│   ├── en.json              # UI strings (single English dictionary)
│   └── utils.ts             # useTranslations() helper
├── layouts/
│   └── Layout.astro         # Base HTML shell: single SEO authority — title composition, canonical, OG/Twitter, JSON-LD, footer slot (no navbar)
├── pages/
│   ├── index.astro          # Home / (Bento dashboard)
│   ├── experience.astro     # /experience/ (full roles listing)
│   ├── credentials.astro    # /credentials/ (full skills matrix)
│   ├── experience/[slug].astro  # /experience/[slug] (dynamic content pages)
│   ├── credentials/[slug].astro  # /credentials/[slug] (dynamic content pages)
│   ├── blog/index.astro     # /blog/ (feed — full posts, centered single column)
│   └── blog/[slug].astro    # /blog/[slug] (permalink for a single post)
├── styles/
│   └── bootstrap.min.css    # PurgeCSS output — generated at build, do not edit manually
├── utils/
│   ├── content.js           # Collection helpers: filterByLocale, getAllPages, getBlogPosts, getExcerpt, cleanSlug
│   ├── date.js               # formatDate() — locks toLocaleDateString to UTC so authored dates render the same day regardless of build-machine timezone
│   ├── seo.js                # schema.org JSON-LD builders (Person/WebSite/ProfilePage graph, BreadcrumbList, BlogPosting, TechArticle) consumed by Layout.astro
│   └── skills.js             # The single reader of src/data/credentials.json — id/label resolution, the tech_stack ↔ case-study reverse index (matrix-wide via caseStudiesForSkillId, and credentialPage-scoped via caseStudiesForCredential), and the derivations behind the matrix and home Bento tiles (see Credentials Data)
└── content.config.ts        # Zod schemas for all 4 collections
```

`public/og.png` (1200×630, outside `src/`) is the site-wide social share image referenced by `Layout.astro`.

### Page Rendering Flow

```
Layout.astro (HTML shell — title composition, canonical link, OG/Twitter tags, JSON-LD, footer slot — no navbar)
└── pages/index.astro → HomePage.astro (Bento dashboard — 6 tiles)
    ├── Tile 1: Hero (two side-by-side terminal panes — `~/career` and `~/stack` — showing build-time-derived stats; no prose copy, no name)
    ├── Tile 2: Profile (name on top as the page's only `<h1>`; avatar + a vertical row of 6 circular icon-only buttons below: Email → opens #contactModal, Phone → opens #phoneModal, WhatsApp/LinkedIn/GitHub/YouTube → external links)
    ├── Tile 3: Latest Posts (3 most recent blog posts by `date`, each row clickable, + View All Posts link to /blog/)
    ├── Tile 4: Tech Stack Matrix (9 curated badges + View Full Stack → /credentials/)
    ├── Tile 5: Case Studies (2 most recent `type: "article"` entries by publishDate, each row clickable, + View All link to /experience/#detailed-case-studies)
    └── Tile 6: Recent Experience (top 3 roles + View Full Experience → /experience/)

pages/experience.astro → Collaboration.astro (full roles + case studies listing, in-page breadcrumb)
pages/credentials.astro → Credentials.astro (full skills matrix listing, in-page breadcrumb)
    └── Every card for a skill referenced by at least one case study's tech_stack also lists "Used in these case studies" links — works for any skill id, not only the two with a deep-dive page — see Credentials Data

pages/{experience,credentials}/[slug].astro → SlugPage.astro
    └── Renders MDX content with in-page breadcrumb; layout adapts to entry type (company / article / credential / certification)
    └── Article entries additionally render a tech_stack badge row (linked to each skill's deep-dive page or /credentials/#<id> anchor); credential entries additionally render a "Used in these case studies" reverse index — see Credentials Data

pages/blog/index.astro → BlogPost.astro (repeated per post)
    └── Feed of all published posts, newest first, full content, one centered column, in-page breadcrumb
pages/blog/[slug].astro → BlogPost.astro
    └── Permalink for a single post (renders an <h1> — required so astro-llms-md picks up its title); in-page breadcrumb
```

**Mobile tile order**: the list above is *visual* order at `md` (768px) and up, not DOM order. In `HomePage.astro`'s markup, Tile 2 (Profile) comes **before** Tile 1 (Hero) — Hero's two terminal panes are tall enough that on a phone, DOM-first-Hero would push Profile (name, avatar, contact icons) below the fold. Tile 1's wrapper carries `order-md-first` (Bootstrap flex-order utility, `order: -1` from `md` up only) to restore the original Hero-left/Profile-right layout on tablet and desktop; below `md` no order override applies, so visual order falls back to DOM order and Profile renders first. Tiles 3–6 are untouched (default `order: 0`), so they still fall in after both regardless of breakpoint.

**Hero terminal (Tile 1)**: Two shell-styled panes (`.term`), `col-12 col-lg-6` each — stacked full-width below `lg` (992px), side by side at `lg` and up. Every value shown is computed in `HomePage.astro`'s frontmatter from content already in other collections, so nothing here is hand-maintained:
- `~/career` pane — `yearsExperience` (current year minus the earliest company `period` start year, via `periodStartYear()` in `src/utils/date.js`), `companies.length` (non-draft `collaborations` where `type === "company"`), and a `$ jobs` list of `currentRoles` (companies whose `period` ends in `"Present"`).
- `~/stack` pane — a `kubectl get skills`-style table built from `skillDomains()` (`src/utils/skills.js`, one row per `src/data/credentials.json` category, padded to a fixed column width for alignment — see `skillsTableText`), and a published blog post count from `allPosts.length` (the same `getBlogPosts()` result Tile 3 slices for its 3 latest).
The table alignment relies on literal space-padding rendered inside a `<pre>`; when editing it, keep the padding logic and the JSX interpolation on a single `{expr}` with no surrounding whitespace in the markup — `<pre>` preserves source indentation verbatim, so a multi-line template there would visibly break alignment.

**Navigation**: There is no top navbar and no fixed bottom breadcrumb bar. Bootstrap breadcrumbs render **in-page** at the top of every non-Home page (Home has none). The Home/Bento Tile 2 has a six-item icon-only button menu next to the avatar (label is `aria-label`/`title` only, no visible text), laid out as a 3-column CSS grid (`.icon-grid`, `grid-template-columns: repeat(3, 42px)`) so the 6 buttons wrap into two even rows of 3 instead of one tall column — sized via `min-height: 120px` to roughly match the avatar's height. Email opens `#contactModal` (rendered by `Footer.astro` → `Contact.astro`), Phone opens `#phoneModal` (rendered by `Footer.astro` → `Phone.astro`), and WhatsApp/LinkedIn/GitHub/YouTube are plain external links (`target="_blank" rel="noopener noreferrer"`) to `https://wa.me/luciano.giacchetta`, `https://www.linkedin.com/in/giacchetta/`, `https://github.com/giacchetta`, and `https://www.youtube.com/@LucianoGiacchetta`. The icons are inlined SVGs imported via Vite's `?raw` suffix from `src/assets/svg/` and injected with Astro's `set:html`, and all 6 buttons share the same neutral `icon-btn-brand` circle for visual consistency. Phone uses a hand-authored monochrome glyph with `fill="currentColor"` (so it picks up the ambient text color rather than a fixed brand color); Email (Gmail), WhatsApp, LinkedIn, GitHub, and YouTube use each brand's official multi-color mark, unmodified except GitHub, which uses its dark-background/white variant to match `Layout.astro`'s hardcoded `data-bs-theme="dark"` — all sourced from thesvg.org. Because `set:html`-injected content isn't part of Astro's scoped-CSS tree, the uniform icon sizing in `HomePage.astro`'s `<style>` block uses `:global(svg)` — a plain `.icon-btn svg` selector would silently never match.

---

## SEO & Structured Data

`Layout.astro` is the single SEO authority — every page routes its metadata through its props rather than composing `<title>`/meta tags itself.

- **Title composition**: pages pass only the page-specific title text as `title`; `Layout.astro` appends `" | " + bio.name` unless `suffix={false}` is passed. Only `HomePage.astro` passes `suffix={false}` (its `site.title` string is already the complete title) — this is why the homepage is the one page whose `<title>` doesn't end in `| Luciano Giacchetta`.
- **Brand vs. entity**: `site.brand` ("Giacchetta Engineering") is a DBA of the real tax name "Luciano Giacchetta". It appears as visible text only in the Home/Bento Tile 2 subtitle and as `Person.alternateName` in JSON-LD — never as the `<title>` suffix, `og:site_name`, or `<meta name="author">`, which all stay "Luciano Giacchetta", the entity with existing search history.
- **Other `Layout.astro` props**: `description`; `ogType` (`"website"` default, `"article"` on blog permalinks, which also emits `article:published_time`/`article:modified_time`); `publishedTime`/`modifiedTime`; `breadcrumbs` — the same `{label, href?}[]` shape already used for the visible Bootstrap breadcrumb, auto-rendered as `BreadcrumbList` JSON-LD; `jsonLd` — page-specific structured-data node(s) (object or array).
- **Structured data builders**: `src/utils/seo.js` exports pure functions (`homeGraph`, `breadcrumbList`, `blogPosting`, `techArticle`) returning plain schema.org objects; `Layout.astro` serializes each into its own `<script type="application/ld+json">`. Every non-Person node references the site's one canonical Person by `@id` (`https://lucianogiacchetta.com/#person`) instead of duplicating Person data.
  - Home (`HomePage.astro`): `Person` (jobTitle, `sameAs` social links, `worksFor` from current roles, `knowsAbout` from `skillNames()` in `src/utils/skills.js`) + `WebSite` + `ProfilePage`, as one `@graph`.
  - Blog permalinks (`pages/blog/[slug].astro`): `BlogPosting` (dates, `tags` as `keywords`, author/publisher → Person).
  - Case studies (`type: "article"` collaborations) and `credentials`/`certifications` deep-dives (`SlugPage.astro`): `TechArticle`. Company profile pages get `BreadcrumbList` only, no `TechArticle` — a company's own page isn't editorial content about it. On case studies, `techArticle()`'s `keywords`/`about` are populated from the entry's resolved `tech_stack` skill labels.
- **Inner-page `<title>`s carry keywords the bare entry title doesn't**: `SlugPage.astro` derives the title per entry type — `"{title} — {role}"` for companies, `"{title} — Case Study"` for articles, `"{title} — Engineering Deep Dive"` for credentials, `"{title} — {provider} Certification"` for certifications — falling back to the bare title when the extra field is absent. The visible `<h1>` is untouched; only `<title>`/`og:title`/`twitter:title` use the enriched version.
- **Description fallback chain** (all four collections): `description` (frontmatter) → `summary` (collaborations only) → `getExcerpt()` (`src/utils/content.js`) → `Layout.astro`'s site-wide `meta.description`. The `getExcerpt()` step means a page missing both `description` and `summary` gets an auto-generated excerpt instead of silently duplicating the site-wide description.
- **Social card**: `public/og.png` (1200×630, generated once from `src/assets/img/profile.png`) is the site-wide `og:image`/`twitter:image` for every page — there is no per-page image and no build-time generation step. Regenerate it by hand (e.g. a one-off `sharp` script rendering an SVG composite, then `sharp().png().toFile()`) if the profile photo or brand copy changes.
- **Sitemap freshness**: `astro.config.mjs` passes a `serialize` function to `@astrojs/sitemap` that reads `lastmod` straight from each entry's frontmatter (`date` for blog, `updateDate`/`publishDate` for the other three collections) via a small regex-based frontmatter reader — content collections aren't available yet this early in config — and sets `changefreq`/`priority` by route (home `1.0`/weekly; section indexes `0.8`/monthly; blog posts `0.7`/yearly; other slug pages `0.6`/monthly).

---

## Content Collections

Defined in `src/content.config.ts`. There are four collections. All collections support a `draft` field (boolean, default `false`); draft entries are filtered out in `getStaticPaths` (all `[slug]` routes), `getAllPages()`, and `getBlogPosts()`, so they are not published as pages or listed anywhere.

### `blog`
Blog posts (`.md` files under `src/content/blog/`), populated both manually and by a CI pipeline that auto-generates a post per merged PR in other ("lab"/PoC) repos. The pipeline itself is a reusable GitHub Actions workflow hosted in this repo (`.github/workflows/post-on-merge.yml`), invoked by those repos via `uses:` — see `.github/post-on-merge.md` for the caller contract, inputs/secrets, and idempotency rules. Frontmatter fields:
- `title` (required string)
- `slug` (optional string) — when present, this becomes the entry's `id`/URL slug instead of the filename (Astro's glob loader default). Files keep a date-prefixed name (e.g. `2026-08-11-....md`) for readability; the route comes from `slug`.
- `description` (optional string) — used verbatim as the page's `<meta name="description">`. **Should be set in frontmatter** (the external generator should produce it, same as `title`/`tags`) rather than relying on the fallback below — an authored one-liner beats a mechanically stripped excerpt.
- `date` (required, coerced to a Date — accepts quoted or unquoted YAML dates)
- `authors` (array of strings, default `[]`)
- `tags` (array of strings, default `[]`)
- `pr` (optional string, URL) — full URL of the source PR (e.g. `https://github.com/<owner>/<repo>/pull/<N>`), computed by the generator (never model-authored) and used both for idempotency and rendered as a "View source PR" link next to the tags in `BlogPost.astro`
- `draft` (boolean, default `false`)

Rendered via `getBlogPosts()` in `src/utils/content.js` (date-descending, drafts filtered), not through `getAllPages()`.

**Meta description fallback**: `src/pages/blog/[slug].astro` uses `post.data.description || getExcerpt(post)` — the same chain `SlugPage.astro` now uses for the other three collections; see [SEO & Structured Data](#seo--structured-data). Without this, a post with no `description` would silently inherit `Layout.astro`'s site-wide default (`meta.description`) — duplicating the homepage's `<meta name="description">` across every such post, an SEO problem. `getExcerpt()` (`src/utils/content.js`) strips Markdown syntax and emoji from `post.body` and truncates to ~155 chars at a word boundary. This is a safety net only; the primary fix is the generator emitting `description` in frontmatter.

### `credentials`
Technical skill deep-dives. Frontmatter fields:
- `title` (required string)
- `description` (optional string)
- `category` (default: `"credentials"`)
- `publishDate`, `updateDate` (optional ISO dates)
- `featured` (boolean, default: `false`)
- `draft` (boolean, default: `false`)

### `collaborations`
Work history entries. Two subtypes controlled by the `type` field:
- `type: "company"` — A company/employer entry (shows role, period, location, summary, logo)
- `type: "article"` — A case study linked to a company via the `company` field (slug of parent)

Frontmatter fields:
- `title`, `description`, `category`, `publishDate`, `updateDate`, `featured`, `draft`
- `role` — Job title
- `period` — Employment dates string (e.g., `"March 2005 - March 2007"`)
- `location` — Geographic location
- `summary` — Long description (supports `|` multiline YAML)
- `logo` — Relative path to image in `src/assets/img/`
- `order` — Number controlling display position in grids
- `type` — `"company"` | `"article"`
- `company` — Slug of the parent company (for articles only)
- `tech_stack` — Array of `src/data/credentials.json` skill `id`s (articles only; not used on `type: "company"` entries). Validated in `src/content.config.ts` via a `superRefine` that checks every id against the live `credentials.json` id set — **an unknown id fails the build** with a Zod error naming the offending content file, rather than silently stripping the field. `SlugPage.astro` resolves ids through `src/utils/skills.js` (`resolveSkills()`, de-duplicated and order-preserving — e.g. `helm-kustomize` collapses two ids into one badge) and renders each as a linked badge: to the skill's `credentials/[slug]` deep-dive page when it has one (`credentialPage`), else to a `/credentials/#<id>` anchor in the full matrix. See [Credentials Data](#credentials-data-non-mdx-skills-grid) for the `id`/`label` contract and the reverse "used in these case studies" index on credential deep-dive pages.

### `certifications`
Professional certifications. Frontmatter fields:
- `title`, `description`, `category`, `publishDate`, `updateDate`, `featured`, `draft`
- `provider` — Issuing organization (e.g., `"Amazon Web Services"`)
- `certificationLevel` — e.g., `"Professional"`, `"Associate"`
- `status` — `"Active"` | `"Expired"`
- `credentialUrl` — URL to verify credential

---

## UI Strings

Source of truth: `src/i18n/en.json` (single English dictionary). `useTranslations()` (no args) in `src/i18n/utils.ts` returns a `t(key)` function that reads from this dictionary.

When adding new UI strings, add the key/value to `src/i18n/en.json` and use `const t = useTranslations();` then `t("your.key")` in the component.

---

## Adding Content

### New Blog Post
1. Create `src/content/blog/[YYYY-MM-DD-slug].md` with `title`, `date`, and (optionally) `slug`, `authors`, `tags`
2. **Always set `description`** (a ~150-160 char SEO summary) — see the fallback caveat in [Content Collections → `blog`](#content-collections)
3. Write the Markdown body — it renders in full on the `/blog/` feed and at its own `/blog/[slug]/` permalink

### New Collaboration (Company)
1. Create `src/content/collaborations/[slug].mdx` with required frontmatter (`type: "company"`, `order`, `logo`, etc.)
2. Add a logo image to `src/assets/img/`

### New Case Study (Article)
1. Create `src/content/collaborations/[slug].mdx` with `type: "article"` and `company: "[parent-company-slug]"`
2. Write the full MDX body (case study content)

### New Credential Deep-dive
1. Create `src/content/credentials/[slug].mdx`
2. Add `featured: true` if it should appear on the home page

### New Certification
1. Create `src/content/certifications/[slug].mdx`
2. Fill in `provider`, `certificationLevel`, `status`, `credentialUrl`

### New UI String
1. Add key/value to `src/i18n/en.json`
2. Use `const t = useTranslations();` in the component, then `t("your.key")`

---

## Credentials Data (Non-MDX Skills Grid)

`src/data/credentials.json` is a categorized list of skills displayed in the credentials grid on the home page, and is the single skills hub `tech_stack` resolves against. It is **not** a content collection, but `src/utils/skills.js` is the only module that reads it directly — the full matrix (`Credentials.astro`), the home Bento tiles (`HomePage.astro`), and the `tech_stack` badge/reverse-index logic (`SlugPage.astro`, `src/content.config.ts`) all go through that module instead of importing the JSON themselves. Structure:

```json
{
  "Category Name": [
    {
      "id": "kebab-case-id",
      "product": "VendorName",
      "type": "Applied Skill",
      "name": "Specific Skill Name",
      "namelnk": "https://..." or "#",
      "typelnk": "https://..." or "#",
      "label": "Short Badge Text",
      "credentialPage": "deep-dive-slug"
    }
  ]
}
```

- **`id`** (required, unique across the whole file) — the skill's stable identity, used by `tech_stack` to reference it and as the matrix card's anchor (`id="<id>"` on `/credentials/`, so `/credentials/#<id>` scrolls to the right card). Convention: kebab-case, bare skill name where globally unique (`terraform`, `nginx`); `<product>-<skill>` where the same skill exists under more than one product (`aws-iam`/`gcp-iam`, `aws-vpc`/`gcp-vpc`). `skillIndex()` in `src/utils/skills.js` throws at build time on a duplicate id.
- **`label`** (optional) — a short, badge-friendly name, used wherever a `tech_stack` entry renders as a tech-stack badge (`skillLabel()` falls back to `name` when absent). Added only where `name` is a long descriptor (e.g. `name: "Artifactory HA & Federation"` → `label: "JFrog Artifactory"`); the matrix card title and `Person.knowsAbout` keep using `name` unchanged.
- **`credentialPage`** (optional) — the slug of a `credentials/[slug].mdx` deep-dive that documents this skill. Distinct from `id`: `id` is the skill's identity everywhere, `credentialPage` only names a page that may or may not exist yet. Today only `github-actions` and `jfrog-artifactory` (→ `artifactory-platform`) have one.

**Reverse index (case study ↔ skill), two places it surfaces:**
- **Full matrix** (`Credentials.astro`, `/credentials/`): every card for a skill `id` that appears in *any* published article's `tech_stack` shows a "used in these case studies" list — direct id-to-id matching via `caseStudiesForSkillId(id, collaborations)` in `src/utils/skills.js`, independent of `credentialPage`. This is what makes the matrix able to link out to a case study for every referenced skill (21 of 44 today), not only the two with a deep-dive page.
- **Deep-dive page** (`SlugPage.astro`, credential branch): the same list, but scoped to whichever skill id(s) name this page via `credentialPage`, built by `caseStudiesForCredential(slug, collaborations)` — a thin wrapper around `caseStudiesForSkillId()`.

Categories currently used: `"Public Cloud"`, `"Private Cloud"`, `"Development"`, `"Networking & Security"`.

---

## Build Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server at `localhost:4321` (copies Bootstrap CSS) |
| `npm run build` | Full production build: PurgeCSS + Astro build |
| `npm run preview` | Preview production build locally |

Cloudflare Pages runs `npm run build` on every push to `main` and deploys the
result. Preview deployments are off, so PRs get no Cloudflare build — instead
`.github/workflows/build-check.yml` runs `npm ci && npm run build` (build
only, no deploy) and is a required status check on `main`. The Pages project
config lives in `tofu-gc-stack` (`cloudflare.tf` → `pages_projects`), not in
this repo.

---

## Key Conventions

- **Slug derivation**: The content entry ID is the filename minus `.mdx` extension. For `telnyx.mdx`, the slug is `telnyx`.
- **Featured flag**: Controls prominence on the home page. Featured entries appear first and as cards; non-featured appear in compact grid.
- **Order field**: Only meaningful for collaborations. Lower number = displayed earlier.
- **Image imports**: Always use relative paths in MDX frontmatter (`../../assets/img/logo.png`). Astro's `Image` component handles optimization.
- **Scoped styles**: All component styles use Astro's `<style>` (scoped by default). Bootstrap utilities handle layout/spacing.
- **No client-side frameworks**: The site is server-rendered static HTML. JavaScript is limited to Bootstrap's bundle (modals/collapse) and small inline scripts for canvas obfuscation and clipboard.
- **Brand icon source**: When a new brand icon is needed for `src/assets/svg/` (e.g. another social/profile link), search [thesvg.org](https://thesvg.org/) — direct SVG files follow the pattern `https://thesvg.org/icons/<brand>/default.svg` (a `dark.svg`/`light.svg` variant may also exist for a specific background, as used for GitHub's white mark against this site's dark theme). Inspect the fetched SVG before committing it (no `<script>`, no external references) and normalize sizing via the shared `.icon-btn`/`.icon-grid` CSS rather than the file's own `width`/`height` attributes.
- **Contact obfuscation**: Both the email (`Contact.astro`) and the phone number (`Phone.astro`) are drawn on a `<canvas>` element and offered only via a "Copy" clipboard button — never rendered as plain text, and never as a `tel:`/`mailto:` href (not even one assigned by JS at runtime, since that still lands in the live DOM). `astro.config.mjs` sets `vite.build.assetsInlineLimit: 0` specifically so these components' hoisted `<script>` blocks are emitted as external hashed chunks under `dist/_astro/` instead of being inlined verbatim into every page's HTML (Astro's default for scripts with no `import`) — removing that setting would put both the email and the phone number back in plain sight of a `curl`/`view-source`.
- **Breadcrumbs**: Rendered in-page via Bootstrap breadcrumb component on non-Home pages (no top navbar, no fixed bottom breadcrumb bar).
- **Client case studies stay agnostic**: name the client only in `company:` frontmatter (so it still slots under the right employer and breadcrumb), never in the article prose. Do not publish a client's exact product versions, repository/permission/alert counts, cloud regions, token lifetimes, or past security gaps — round scale figures (e.g. "dozens of repositories", "~100 GiB") and describe topology in generic terms (e.g. "one on AWS, one on GCP, in separate geographies") instead. Vendor/product names (JFrog, Okta, Vault, ArgoCD, etc.) are not the client and stay in — they're what makes the skills grid and credential deep-dives meaningful. See `artifactory-multicloud-platform.mdx` and `jenkins-migration-github-argocd.mdx` for the pattern.
- **Every page needs an `<h1>`**: `astro-llms-md`'s default `titleSelector` is `h1`; a page with no `<h1>` is silently skipped from `.md` generation and `llms.txt` (no build error). `BlogPost.astro` accepts a `headingTag` prop (`"h1"` on the permalink page, `"h2"` in the feed) to guarantee exactly one `<h1>` per page. On Home, the `<h1>` is the name in Tile 2 (Profile) — Tile 1 (Hero) is decorative and has none, so if the name is ever demoted back to a `<p>`, the homepage silently drops out of `llms.txt`.

---

## Agent / LLM Access

The site exposes machine-readable content via the `astro-llms-md` integration, which runs post-build and converts every HTML page to a clean `.md` file.

**Generated files (in `dist/` and served live):**
- `/llms.txt` — discovery index linking all `.md` files, grouped by section
- `/llms-full.txt` — all page content concatenated in a single file
- Per-page markdown at the same path as the HTML page: e.g., `/experience.md`, `/experience/telnyx.md`, `/blog.md`, `/blog/[slug].md`

**Configuration** (in `astro.config.mjs`):
- `contentSelector: 'main'` — extracts only the `<main>` element, excluding nav/footer/breadcrumbs
- `excludeSelectors: [...DEFAULT_NOISE_SELECTORS]` — strips `nav`, `aside`, `footer`, `form`, hidden elements
- `exclude` — legacy SEO redirect stubs (e.g., `github-actions`, `bimodal`, `codyops`, `jenkins-migration-github-argocd`) whose canonical content lives under `/experience/` and `/credentials/`

**No manual maintenance**: The markdown files are regenerated automatically on every build. Do not commit files from `dist/`.

---

## Do Not

- Do not edit `src/styles/bootstrap.min.css` manually — it is generated by PurgeCSS at build time.
- Do not introduce CSS frameworks other than Bootstrap 5.3.
- Do not render the email address or phone number as plain text, or as a `mailto:`/`tel:` href — canvas-render them (`Contact.astro`, `Phone.astro`) and offer a Copy button instead.
- Do not remove or lower `vite.build.assetsInlineLimit: 0` in `astro.config.mjs` — it's what keeps the canvas-obfuscated components' scripts out of the served page HTML.
- Do not add client-side JS frameworks (React, Vue, etc.) without explicit instruction.
- Do not reintroduce multilingual/i18n locales or a translation pipeline — the site is English-only by design.
- Do not use `site.brand` ("Giacchetta Engineering") as the `<title>` suffix, `og:site_name`, or `<meta name="author">` — it's a DBA of the real tax name "Luciano Giacchetta", the entity with existing search history. The brand belongs only in the Home Tile 2 subtitle and `Person.alternateName` in JSON-LD.
