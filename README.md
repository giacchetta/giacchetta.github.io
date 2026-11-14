# Luciano Giacchetta — Professional Portfolio

An English-only professional portfolio built with **Astro 7**, featuring a modern Bento UI dashboard homepage. Showcases career history, technical credentials, certifications, detailed case studies, and a blog.

**Live site**: https://luciano.giacchetta.com.ar

---

## Tech Stack

- **Framework**: [Astro](https://astro.build) v7.x
- **Content**: [MDX](https://mdxjs.com) with Astro Content Collections (Zod schemas)
- **Styling**: [Bootstrap](https://getbootstrap.com) v5.3.x
- **CSS Optimization**: [PurgeCSS](https://purgecss.com) — removes unused Bootstrap at build time
- **UI strings**: `src/i18n/en.json` (single English dictionary)
- **Sitemap**: `@astrojs/sitemap`
- **Agent/LLM access**: `astro-llms-md` — generates per-page `.md` files, `/llms.txt`, and `/llms-full.txt` at build time
- **Deployment**: [Cloudflare Pages](https://pages.cloudflare.com) — builds and deploys automatically on push to `main`, managed in `tofu-gc-stack` (see `cloudflare.tf` → `pages_projects`)

---

## Project Structure

```
/
├── src/
│   ├── assets/img/                 # Logos, icons, profile images (PNG/SVG)
│   ├── assets/svg/                 # Profile-tile icons (brand marks + phone), inlined via ?raw + set:html
│   ├── components/                 # Astro UI components
│   │   ├── BlogPost.astro
│   │   ├── Prose.astro             # shared markdown typography wrapper
│   │   ├── Collaboration.astro
│   │   ├── Contact.astro
│   │   ├── Credentials.astro
│   │   ├── Footer.astro
│   │   ├── HomePage.astro
│   │   ├── Phone.astro
│   │   └── SlugPage.astro
│   ├── content/
│   │   ├── blog/                   # Markdown blog posts
│   │   ├── certifications/         # MDX certification entries
│   │   ├── collaborations/         # MDX company and case-study entries
│   │   └── credentials/            # MDX technical skill deep-dives
│   ├── content.config.ts           # Content collection Zod schemas
│   ├── data/
│   │   ├── credentials.json        # Skills grid data
│   │   └── projects.json           # Home Tile 7 — Featured Projects
│   ├── i18n/
│   │   ├── en.json                 # UI strings (single English dictionary)
│   │   └── utils.ts                # useTranslations()
│   ├── layouts/Layout.astro        # Base HTML: single SEO authority — title composition, canonical link, OG/Twitter tags, JSON-LD, footer slot (no navbar)
│   ├── pages/
│   │   ├── index.astro             # /  (home — Bento dashboard)
│   │   ├── experience.astro        # /experience/  (full roles listing)
│   │   ├── credentials.astro       # /credentials/  (full skills matrix)
│   │   ├── experience/[slug].astro # /experience/[slug]  (content pages)
│   │   ├── credentials/[slug].astro # /credentials/[slug]  (content pages)
│   │   ├── ansina.astro            # /ansina/  (giacchetta/ansina README, fetched at build time)
│   │   ├── blog/index.astro        # /blog/  (post feed, full content, centered column)
│   │   ├── blog/[slug].astro       # /blog/[slug]  (post permalink)
│   │   └── 404.astro               # dist/404.html — makes Cloudflare Pages return a real 404 for unknown URLs (without it, Pages serves index.html with 200)
│   ├── styles/bootstrap.min.css    # PurgeCSS output — do not edit manually
│   └── utils/
│       ├── content.js              # filterByLocale(), getAllPages(), getBlogPosts(), getExcerpt(), cleanSlug()
│       ├── readme.js               # /ansina/ README URLs + prepareReadme() (link rewriting, mermaid)
│       ├── date.js                 # formatDate() — UTC-locked date formatting
│       ├── seo.js                  # schema.org JSON-LD builders consumed by Layout.astro
│       └── skills.js               # single reader of credentials.json — id/label resolution, tech_stack ↔ credential reverse index
├── public/og.png                   # Site-wide social share image (1200×630)
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

---

## Commands

| Command | Action |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at `localhost:4321` |
| `npm run build` | Production build: PurgeCSS + Astro build |
| `npm run preview` | Preview production build locally |

---

## Navigation & Contact

- **No top navbar** and **no fixed bottom breadcrumb bar**. Bootstrap breadcrumbs render **in-page** at the top of every non-Home page (Home has none).
- **Terminals tile**: the Home/Bento Tile 2 is two shell-styled panes, side by side from `lg` and up, stacked full-width below it — `~/career` (years of experience, company count, and currently-running roles) and `~/stack` (a skills-per-category table plus published blog post count). Every number is derived at build time from the site's own content collections, so it's never hand-maintained.
- **One-screen desktop layout**: from 1200×700 up the Home Bento is a viewport-height 3-row CSS grid so all tiles show without scrolling (supported floor 1536×864 effective, i.e. ~1536×740 of browser viewport; 1366×768 is not supported). Smaller screens and phones keep the stacked, scrolling layout.
- **Latest Posts tile**: Home/Bento Tile 6 shows the newest posts as a pill grid (3 columns from `lg`, no dates since the order is the date; a dot colored by each post's first tag; 6 pills, 9 on desktops at least 900px tall). Recent Experience (Tile 3) shows the last 2 roles.
- **Featured Projects tile**: the Home/Bento Tile 7 is a full-width tile at the bottom, one clickable row per entry in `src/data/projects.json` (`emoji`, `title`, `href`, `description`), two per row from `md` up. Featuring another project is a JSON edit only — currently just Ansina (`/ansina/`).
- **Profile tile**: the Home/Bento Tile 1 (first on every screen size) shows the name on top (the page's only `<h1>`) with a 🧑‍💻 emoji beside it, then the avatar next to a six-item icon-only button menu (name via `aria-label`/`title`, no visible text), wrapped into a 3+3 grid so its height roughly matches the avatar — Email (Gmail) and Phone open modals (`#contactModal`, `#phoneModal`); WhatsApp, LinkedIn, GitHub, and YouTube are plain external links (`target="_blank" rel="noopener noreferrer"`). Icons live in `src/assets/svg/` and are inlined via a Vite `?raw` import + `set:html`.
- **Contact via canvas only**: both the email and phone number are drawn on a `<canvas>` and offered only via a Copy-to-clipboard button — never rendered as plain text, and never as a `mailto:`/`tel:` href. `astro.config.mjs` sets `vite.build.assetsInlineLimit: 0` so these components' scripts are emitted as external hashed JS chunks instead of being inlined into every page's HTML — required for the obfuscation to hold.

---

## SEO & Structured Data

`Layout.astro` composes every page's `<title>` (page title + `" | Luciano Giacchetta"`, except the homepage), meta description, canonical link, Open Graph/Twitter tags, and JSON-LD structured data (via builders in `src/utils/seo.js`). "Giacchetta Engineering" is a DBA of the real name "Luciano Giacchetta" and appears only as a `Person.alternateName` in JSON-LD (not as visible text) — the title suffix and `og:site_name` stay "Luciano Giacchetta". Every page carries `BreadcrumbList` JSON-LD from the same data driving its visible breadcrumb; the homepage additionally carries a `Person` + `WebSite` + `ProfilePage` graph, blog permalinks carry `BlogPosting` (author/publisher inline `name` + `url`, so they resolve without the home page's Person node), `/ansina/` carries `SoftwareSourceCode`, and case studies/credential/certification pages carry `TechArticle`. The sitemap (`@astrojs/sitemap` in `astro.config.mjs`) attaches `lastmod`/`changefreq`/`priority` per URL — `lastmod` from content frontmatter, and for index routes (`/`, `/blog/`, `/experience/`, `/credentials/`, `/ansina/`) derived from the newest related entry.

---

## Content Collections

### `blog`
Blog posts rendered as full Markdown (title, date, authors, tags). Listed newest-first on `/blog/` as summaries (title, tags, description, "Read more"); the full text lives only at each `/blog/[slug]/` permalink. Ansina-repo posts link back to `/ansina/`. Always set a frontmatter `description` — it becomes the page's meta description; without one it falls back to an auto-generated excerpt rather than the site-wide default.

### `ansina`
Remote collection: the `giacchetta/ansina` README, fetched with `fetch` from raw.githubusercontent.com on every build and rendered at `/ansina/`. A failed fetch fails the build. The page adds its own intro, a text caption under the diagram, a list of related Ansina posts and `SoftwareSourceCode` JSON-LD. Relative links are rewritten to GitHub; the mermaid diagram renders client-side (pinned mermaid.js from jsDelivr, this page only).

### `collaborations`
Work history entries with two subtypes:
- `type: "company"` — An employer entry (role, period, location, summary, logo)
- `type: "article"` — A case study linked to a company via the `company` field, optionally carrying a `tech_stack` array of `credentials.json` skill ids (renders as linked badges; an unknown id fails the build — see AGENTS.md)

### `credentials`
Technical skill deep-dives rendered as full MDX pages.

### `certifications`
Professional certifications with provider, level, status, and credential URL.

---

## Deployment

Cloudflare Pages is git-connected to this repo and builds automatically on
push to `main`:
1. Cloudflare installs dependencies and runs `npm run build` (PurgeCSS → Astro build)
2. Cloudflare serves `dist/` from the `lucianogiacchetta` Pages project

The project itself (build command, custom domain, env vars) is managed as
code in the `tofu-gc-stack` repo, not in this one. Preview deployments are
deliberately off (builds are verified locally and Dependabot PRs don't need
a live preview) — PRs instead get a plain build-only CI check (see below).

### PR build check

`.github/workflows/build-check.yml` runs `npm ci && npm run build` on every
PR to `main` — no deploy, just a pass/fail signal that the build still works
(catches a Dependabot bump breaking the build, for example). It's a required
status check on `main`.

---

## License

[GNU General Public License v3.0 (GPL-3.0-only)](LICENSE)
