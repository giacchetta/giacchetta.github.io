# AGENTS.md

> **Mandatory**: After every change to the project (features added, removed, or modified), update this file (AGENTS.md) and README.md to reflect the current state. Do not leave either file stale. Do not commit code.

---

## What this project is

A professional portfolio site for Luciano Giacchetta, a DevOps/Cloud/Systems Engineer. It is a statically generated, **English-only** site built with **Astro 7** and deployed to GitHub Pages.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Astro 7.x with MDX integration |
| Styling | Bootstrap 5.3 - Keep custom CSS to an absolute minimum |
| CSS Optimization | PurgeCSS (strips unused Bootstrap at build time) |
| Content | Astro Content Collections with Zod schemas, MDX files |
| UI strings | `src/i18n/en.json` (single English dictionary) |
| Sitemap | `@astrojs/sitemap` |
| Agent/LLM access | `astro-llms-md` — per-page `.md` files + `/llms.txt` + `/llms-full.txt` |
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
├── data/                    # credentials.json (skills grid data)
├── i18n/
│   ├── en.json              # UI strings (single English dictionary)
│   └── utils.ts             # useTranslations() helper
├── layouts/
│   └── Layout.astro         # Base HTML shell: SEO head, footer slot (no navbar)
├── pages/
│   ├── index.astro          # Home / (Bento dashboard)
│   ├── experience.astro     # /experience/ (full roles listing)
│   ├── credentials.astro    # /credentials/ (full skills matrix)
│   ├── experience/[slug].astro  # /experience/[slug] (dynamic content pages)
│   └── credentials/[slug].astro  # /credentials/[slug] (dynamic content pages)
├── styles/
│   └── bootstrap.min.css    # PurgeCSS output — generated at build, do not edit manually
├── utils/
│   └── content.js           # Collection helpers: filterByLocale, getAllPages, cleanSlug
└── content.config.ts        # Zod schemas for all 3 collections
```

### Page Rendering Flow

```
Layout.astro (HTML shell, SEO, canonical link, footer slot — no navbar)
└── pages/index.astro → HomePage.astro (Bento dashboard — 6 tiles)
    ├── Tile 1: Hero (greeting + tagline)
    ├── Tile 2: Profile (profile pic, name, Email button → opens #contactModal)
    ├── Tile 3: Empty placeholder (future use; full-width on mobile, 1/3 column on desktop)
    ├── Tile 4: Tech Stack Matrix (9 curated badges + View Full Stack → /credentials/)
    ├── Tile 5: Featured Case Study (jenkins-migration-github-argocd)
    └── Tile 6: Recent Experience (top 3 roles + View Full Experience → /experience/)

pages/experience.astro → Collaboration.astro (full roles + case studies listing, in-page breadcrumb)
pages/credentials.astro → Credentials.astro (full skills matrix listing, in-page breadcrumb)

pages/{experience,credentials}/[slug].astro → SlugPage.astro
    └── Renders MDX content with in-page breadcrumb; layout adapts to entry type (company / article / credential / certification)
```

**Navigation**: There is no top navbar and no fixed bottom breadcrumb bar. Bootstrap breadcrumbs render **in-page** at the top of every non-Home page (Home has none). The only email entry point is the Home/Bento Tile 2 Email button, which opens the `#contactModal` (rendered by `Footer.astro` → `Contact.astro`).

---

## Content Collections

Defined in `src/content.config.ts`. There are three collections. All collections support a `draft` field (boolean, default `false`); draft entries are filtered out in `getStaticPaths` (both `[slug]` routes) and `getAllPages()`, so they are not published as pages or listed anywhere.

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
| `npm run dev` | Dev server at `localhost:4321` (copies Bootstrap CSS) |
| `npm run build` | Full production build: PurgeCSS + Astro build |
| `npm run preview` | Preview production build locally |

The CI/CD workflow (`.github/workflows/static.yaml`) runs `npm run build`.

---

## Key Conventions

- **Slug derivation**: The content entry ID is the filename minus `.mdx` extension. For `telnyx.mdx`, the slug is `telnyx`.
- **Featured flag**: Controls prominence on the home page. Featured entries appear first and as cards; non-featured appear in compact grid.
- **Order field**: Only meaningful for collaborations. Lower number = displayed earlier.
- **Image imports**: Always use relative paths in MDX frontmatter (`../../assets/img/logo.png`). Astro's `Image` component handles optimization.
- **Scoped styles**: All component styles use Astro's `<style>` (scoped by default). Bootstrap utilities handle layout/spacing.
- **No client-side frameworks**: The site is server-rendered static HTML. JavaScript is limited to Bootstrap's bundle (modals/collapse) and small inline scripts for canvas obfuscation and clipboard.
- **Contact obfuscation**: The email address is drawn on a `<canvas>` element (in `Contact.astro`) to prevent scraping. Do not render it as plain text. There are no phone numbers on the site.
- **Breadcrumbs**: Rendered in-page via Bootstrap breadcrumb component on non-Home pages (no top navbar, no fixed bottom breadcrumb bar).

---

## Agent / LLM Access

The site exposes machine-readable content via the `astro-llms-md` integration, which runs post-build and converts every HTML page to a clean `.md` file.

**Generated files (in `dist/` and served live):**
- `/llms.txt` — discovery index linking all `.md` files, grouped by section
- `/llms-full.txt` — all page content concatenated in a single file
- Per-page markdown at the same path as the HTML page: e.g., `/experience.md`, `/experience/telnyx.md`

**Configuration** (in `astro.config.mjs`):
- `contentSelector: 'main'` — extracts only the `<main>` element, excluding nav/footer/breadcrumbs
- `excludeSelectors: [...DEFAULT_NOISE_SELECTORS]` — strips `nav`, `aside`, `footer`, `form`, hidden elements
- `exclude` — legacy SEO redirect stubs (e.g., `github-actions`, `bimodal`, `codyops`, `jenkins-migration-github-argocd`) whose canonical content lives under `/experience/` and `/credentials/`

**No manual maintenance**: The markdown files are regenerated automatically on every build. Do not commit files from `dist/`.

---

## Do Not

- Do not edit `src/styles/bootstrap.min.css` manually — it is generated by PurgeCSS at build time.
- Do not introduce CSS frameworks other than Bootstrap 5.3.
- Do not render the email address as plain text in HTML (use canvas obfuscation in `Contact.astro`).
- Do not add phone numbers to the site.
- Do not add client-side JS frameworks (React, Vue, etc.) without explicit instruction.
- Do not reintroduce multilingual/i18n locales or a translation pipeline — the site is English-only by design.
