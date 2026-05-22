# AGENTS.md

> **Mandatory**: After every change to the project (features added, removed, or modified), update this file (AGENTS.md) and README.md to reflect the current state. Do not leave either file stale. Do not commit code.

---

## What this project is

A professional portfolio site for Luciano Giacchetta, a DevOps/Cloud/Systems Engineer. It is a statically generated, multilingual (English, Argentine Spanish, Uruguayan Spanish) site built with **Astro 6** and deployed to GitHub Pages.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Astro 6.x with MDX integration |
| Styling | Bootstrap 5.3 - Keep custom CSS to an absolute minimum |
| CSS Optimization | PurgeCSS (strips unused Bootstrap at build time) |
| Content | Astro Content Collections with Zod schemas, MDX files |
| i18n | Astro built-in i18n + AI-powered translation script (`scripts/translate.mjs`) |
| Sitemap | `@astrojs/sitemap` with i18n support |
| Deployment | GitHub Actions → GitHub Pages |

**CSS Rule**: Only use Bootstrap 5.3 classes. Do not introduce any other CSS framework or large custom stylesheets.

---

## Architecture Overview

### Directory Structure

```
src/
├── assets/img/              # Images and logos (PNG/SVG) imported in MDX and components
├── components/              # All UI components (Astro components only)
├── content/                 # MDX content collections
│   ├── certifications/      # Certification entries
│   ├── collaborations/      # Company and article entries
│   └── credentials/         # Technical skill deep-dives
├── data/                    # credentials.json + localized variants (auto-generated)
├── i18n/                    # en.json (source) + auto-generated es-ar.json, es-uy.json
├── layouts/
│   └── Layout.astro         # Base HTML shell: SEO head, navbar, footer slot
├── pages/
│   ├── index.astro          # English home / (Bento dashboard)
│   ├── experience.astro     # English /experience/ (full roles listing)
│   ├── credentials.astro    # English /credentials/ (full skills matrix)
│   ├── [slug].astro         # English dynamic content pages /[slug]
│   ├── es-ar/index.astro    # /es-ar/
│   ├── es-ar/experience.astro  # /es-ar/experience/
│   ├── es-ar/credentials.astro # /es-ar/credentials/
│   ├── es-ar/[slug].astro   # /es-ar/[slug]
│   ├── es-uy/index.astro    # /es-uy/
│   ├── es-uy/experience.astro  # /es-uy/experience/
│   ├── es-uy/credentials.astro # /es-uy/credentials/
│   └── es-uy/[slug].astro   # /es-uy/[slug]
├── styles/
│   └── bootstrap.min.css    # PurgeCSS output — generated at build, do not edit manually
├── utils/
│   └── content.js           # Collection helpers: filterByLocale, getAllPages, cleanSlug
└── content.config.ts        # Zod schemas for all 3 collections
scripts/
└── translate.mjs            # AI-powered i18n: translates MDX + JSON to es-ar / es-uy
```

### Page Rendering Flow

```
Layout.astro (HTML shell, SEO, hreflangs)
└── pages/index.astro → HomePage.astro (Bento dashboard — 6 tiles)
    ├── Tile 1: Hero (greeting + tagline)
    ├── Tile 2: Profile & Status (profile pic, availability badge, AWS SA Pro badge)
    ├── Tile 3: Emergency CTA — desktop only (canvas-obfuscated phone, d-none d-md-flex)
    ├── Tile 4: Tech Stack Matrix (9 curated badges + View Full Stack → /credentials/)
    ├── Tile 5: Featured Case Study (jenkins-migration-github-argocd)
    └── Tile 6: Recent Experience (top 3 roles + View Full Experience → /experience/)

pages/experience.astro → Collaboration.astro (full roles + case studies listing)
pages/credentials.astro → Credentials.astro (full skills matrix listing)

pages/[slug].astro → SlugPage.astro
    └── Renders MDX content with layout that adapts to entry type (company / article / credential / certification)
```

---

## Content Collections

Defined in `src/content.config.ts`. There are three collections:

### `credentials`
Technical skill deep-dives. Frontmatter fields:
- `title` (required string)
- `description` (optional string)
- `category` (default: `"credentials"`)
- `publishDate`, `updateDate` (optional ISO dates)
- `featured` (boolean, default: `false`)

### `collaborations`
Work history entries. Two subtypes controlled by the `type` field:
- `type: "company"` — A company/employer entry (shows role, period, location, summary, logo)
- `type: "article"` — A case study linked to a company via the `company` field (slug of parent)

Frontmatter fields:
- `title`, `description`, `category`, `publishDate`, `updateDate`, `featured`
- `role` — Job title
- `period` — Employment dates string (e.g., `"March 2005 - March 2007"`)
- `location` — Geographic location
- `summary` — Long description (supports `|` multiline YAML)
- `logo` — Relative path to image in `src/assets/img/`
- `order` — Number controlling display position in grids
- `type` — `"company"` | `"article"`
- `company` — Slug of the parent company (for articles only)

### `certifications`
Professional certifications. Frontmatter fields:
- `title`, `description`, `category`, `publishDate`, `updateDate`, `featured`
- `provider` — Issuing organization (e.g., `"Amazon Web Services"`)
- `certificationLevel` — e.g., `"Professional"`, `"Associate"`
- `status` — `"Active"` | `"Expired"`
- `credentialUrl` — URL to verify credential

---

## i18n System

### Locales
- `en` — English (default, no URL prefix — `/`, `/[slug]`)
- `es-ar` — Argentine Spanish (`/es-ar/`, `/es-ar/[slug]`)
- `es-uy` — Uruguayan Spanish (`/es-uy/`, `/es-uy/[slug]`)

### Content Localization Convention
For each MDX file `example.mdx` (English base), localized variants are named:
- `example.es-ar.mdx` — Argentine Spanish
- `example.es-uy.mdx` — Uruguayan Spanish

Files ending in `.es-ar` or `.es-uy` are automatically stripped of that suffix to produce the slug. The utility `filterByLocale()` in `src/utils/content.js` handles locale selection with English fallback.

### UI Strings
Source of truth: `src/i18n/en.json` (30 keys). Generated files `es-ar.json` and `es-uy.json` are produced by `scripts/translate.mjs`. Do not edit the generated files manually.

When adding new UI strings, add the key to `en.json` only; the translation script handles the rest.

### Data Localization
`src/data/credentials.json` is the English source. `credentials.es-ar.json` and `credentials.es-uy.json` are auto-generated by the translation script.

---

## Adding Content

### New Collaboration (Company)
1. Create `src/content/collaborations/[slug].mdx` with required frontmatter (`type: "company"`, `order`, `logo`, etc.)
2. Add a logo image to `src/assets/img/`
3. Run `npm run translate` to generate localized versions (or write them manually as `[slug].es-ar.mdx` / `[slug].es-uy.mdx`)

### New Case Study (Article)
1. Create `src/content/collaborations/[slug].mdx` with `type: "article"` and `company: "[parent-company-slug]"`
2. Write the full MDX body (case study content)
3. Run `npm run translate`

### New Credential Deep-dive
1. Create `src/content/credentials/[slug].mdx`
2. Add `featured: true` if it should appear on the home page
3. Run `npm run translate`

### New Certification
1. Create `src/content/certifications/[slug].mdx`
2. Fill in `provider`, `certificationLevel`, `status`, `credentialUrl`
3. Run `npm run translate`

### New UI String
1. Add key/value to `src/i18n/en.json`
2. Use `const t = useTranslations(locale)` in the component, then `t("your.key")`
3. Run `npm run translate`

---

## Credentials Data (Non-MDX Skills Grid)

`src/data/credentials.json` is a categorized list of skills displayed in the credentials grid on the home page. It is **not** a content collection. Structure:

```json
{
  "Category Name": [
    {
      "product": "VendorName",
      "type": "Applied Skill",
      "name": "Specific Skill Name",
      "namelnk": "https://..." or "#",
      "typelnk": "https://..." or "#"
    }
  ]
}
```

Categories currently used: `"Public Cloud"`, `"Private Cloud"`, `"Development"`, `"Networking & Security"`.

---

## Build Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server at `localhost:4321` (copies Bootstrap CSS, no translation) |
| `npm run build` | Full production build: PurgeCSS + translate + Astro build |
| `npm run build:no-translate` | Production build without running translation (used by CI) |
| `npm run translate` | Run AI translation script only |
| `npm run dev:i18n` | Translate then start dev server |

The CI/CD workflow (`.github/workflows/static.yaml`) runs `npm run build:no-translate`. Translation runs locally and the generated files are committed.

---

## Key Conventions

- **Slug derivation**: The content entry ID is the filename minus `.mdx` extension and locale suffix. For `telnyx.es-ar.mdx`, the slug is `telnyx`.
- **Featured flag**: Controls prominence on the home page. Featured entries appear first and as cards; non-featured appear in compact grid.
- **Order field**: Only meaningful for collaborations. Lower number = displayed earlier.
- **Image imports**: Always use relative paths in MDX frontmatter (`../../assets/img/logo.png`). Astro's `Image` component handles optimization.
- **Scoped styles**: All component styles use Astro's `<style>` (scoped by default). Bootstrap utilities handle layout/spacing.
- **No client-side frameworks**: The site is server-rendered static HTML. JavaScript is limited to Bootstrap's bundle (modals/collapse) and small inline scripts for canvas obfuscation and clipboard.
- **Contact/phone obfuscation**: Email and phone numbers are drawn on `<canvas>` elements to prevent scraping. Do not render them as plain text.
- **Translation cache**: `.translation-cache.json` caches AI translations by SHA256 hash of source content. Commit this file.

---

## Adding a New Locale

1. Add locale to `astro.config.mjs` (`i18n.locales` and `sitemap.i18n.locales`)
2. Create `src/pages/[locale]/index.astro` and `src/pages/[locale]/[slug].astro` (copy existing locale pages as template)
3. Add locale to `src/i18n/utils.ts` (`locales` array and date locale map)
4. Add locale instructions to `scripts/translate.mjs`
5. Add locale data files: `src/data/credentials.[locale].json`
6. Run `npm run translate`

---

## Do Not

- Do not edit `src/styles/bootstrap.min.css` manually — it is generated by PurgeCSS at build time.
- Do not edit `src/i18n/es-ar.json`, `src/i18n/es-uy.json`, or `src/data/credentials.es-ar.json` / `credentials.es-uy.json` directly — these are generated by the translation script.
- Do not introduce CSS frameworks other than Bootstrap 5.3.
- Do not render email addresses or phone numbers as plain text in HTML (use canvas obfuscation).
- Do not add client-side JS frameworks (React, Vue, etc.) without explicit instruction.
