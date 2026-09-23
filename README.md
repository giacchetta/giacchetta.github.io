# Luciano Giacchetta — Professional Portfolio

An English-only professional portfolio built with **Astro 7**, featuring a modern Bento UI dashboard homepage. Showcases career history, technical credentials, certifications, detailed case studies, and a blog.

**Live site**: https://lucianogiacchetta.com

---

## Tech Stack

- **Framework**: [Astro](https://astro.build) v7.x
- **Content**: [MDX](https://mdxjs.com) with Astro Content Collections (Zod schemas)
- **Styling**: [Bootstrap](https://getbootstrap.com) v5.3.x
- **CSS Optimization**: [PurgeCSS](https://purgecss.com) — removes unused Bootstrap at build time
- **UI strings**: `src/i18n/en.json` (single English dictionary)
- **Sitemap**: `@astrojs/sitemap`
- **Agent/LLM access**: `astro-llms-md` — generates per-page `.md` files, `/llms.txt`, and `/llms-full.txt` at build time
- **Deployment**: GitHub Actions → GitHub Pages

---

## Project Structure

```
/
├── .github/workflows/static.yaml   # CI/CD: build and deploy to GitHub Pages
├── src/
│   ├── assets/img/                 # Logos, icons, profile images (PNG/SVG)
│   ├── assets/svg/                 # Profile-tile icons (brand marks + phone), inlined via ?raw + set:html
│   ├── components/                 # Astro UI components
│   │   ├── BlogPost.astro
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
│   │   └── credentials.json        # Skills grid data
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
│   │   ├── blog/index.astro        # /blog/  (post feed, full content, centered column)
│   │   └── blog/[slug].astro       # /blog/[slug]  (post permalink)
│   ├── styles/bootstrap.min.css    # PurgeCSS output — do not edit manually
│   └── utils/
│       ├── content.js              # filterByLocale(), getAllPages(), getBlogPosts(), getExcerpt(), cleanSlug()
│       ├── date.js                 # formatDate() — UTC-locked date formatting
│       └── seo.js                  # schema.org JSON-LD builders consumed by Layout.astro
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
- **Hero terminal**: the Home/Bento Tile 1 is two shell-styled panes, side by side from `lg` and up, stacked full-width below it — `~/career` (years of experience, company count, and currently-running roles) and `~/stack` (a skills-per-category table plus published blog post count). Every number is derived at build time from the site's own content collections, so it's never hand-maintained. It sits **after** the Profile tile in the markup (`order-md-first` puts it visually first again from `md` up) so a phone shows the compact Profile tile before this taller one.
- **Profile tile**: the Home/Bento Tile 2 shows the name on top (the page's only `<h1>`), then the avatar next to a six-item icon-only button menu (name via `aria-label`/`title`, no visible text), wrapped into a 3+3 grid so its height roughly matches the avatar — Email (Gmail) and Phone open modals (`#contactModal`, `#phoneModal`); WhatsApp, LinkedIn, GitHub, and YouTube are plain external links (`target="_blank" rel="noopener noreferrer"`). Icons live in `src/assets/svg/` and are inlined via a Vite `?raw` import + `set:html`.
- **Contact via canvas only**: both the email and phone number are drawn on a `<canvas>` and offered only via a Copy-to-clipboard button — never rendered as plain text, and never as a `mailto:`/`tel:` href. `astro.config.mjs` sets `vite.build.assetsInlineLimit: 0` so these components' scripts are emitted as external hashed JS chunks instead of being inlined into every page's HTML — required for the obfuscation to hold.

---

## SEO & Structured Data

`Layout.astro` composes every page's `<title>` (page title + `" | Luciano Giacchetta"`, except the homepage), meta description, canonical link, Open Graph/Twitter tags, and JSON-LD structured data (via builders in `src/utils/seo.js`). "Giacchetta Engineering" is a DBA of the real name "Luciano Giacchetta" and appears only as the Home-tile subtitle and a `Person.alternateName` — the title suffix and `og:site_name` stay "Luciano Giacchetta". Every page carries `BreadcrumbList` JSON-LD from the same data driving its visible breadcrumb; the homepage additionally carries a `Person` + `WebSite` + `ProfilePage` graph, blog permalinks carry `BlogPosting`, and case studies/credential/certification pages carry `TechArticle`. The sitemap (`@astrojs/sitemap` in `astro.config.mjs`) attaches `lastmod`/`changefreq`/`priority` per URL, read from content frontmatter.

---

## Content Collections

### `blog`
Blog posts rendered as full Markdown (title, date, authors, tags). Listed newest-first on `/blog/`, each with its own `/blog/[slug]/` permalink. Always set a frontmatter `description` — it becomes the page's meta description; without one it falls back to an auto-generated excerpt rather than the site-wide default.

### `collaborations`
Work history entries with two subtypes:
- `type: "company"` — An employer entry (role, period, location, summary, logo)
- `type: "article"` — A case study linked to a company via the `company` field

### `credentials`
Technical skill deep-dives rendered as full MDX pages.

### `certifications`
Professional certifications with provider, level, status, and credential URL.

---

## Deployment

Pushes to `main` trigger the GitHub Actions workflow (`.github/workflows/static.yaml`):
1. Install dependencies (`npm ci`)
2. Build with `npm run build` (PurgeCSS → Astro build)
3. Deploy `dist/` to GitHub Pages

---

## License

[GNU General Public License v3.0 (GPL-3.0-only)](LICENSE)
