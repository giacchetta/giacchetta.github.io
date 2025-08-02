# giacchetta.github.io

This professional online portfolio, meticulously crafted with AstroJS v4.x, serves as a comprehensive digital representation of my career. It is designed to vividly showcase my extensive professional credentials, detailing my educational background, qualifications, and affiliations. The site provides an in-depth look at my work experience, highlighting key roles, responsibilities, and achievements across various projects and organizations. Furthermore, it features notable collaborations, underscoring my ability to work effectively in team environments and contribute to successful collective endeavors. My certifications are also prominently displayed, demonstrating my commitment to continuous learning and professional development. Beyond these core elements, the website integrates a range of other pertinent career information, offering a holistic view of my skills, expertise, and professional journey, all presented in a clean, responsive, and user-friendly interface powered by the latest version of AstroJS.

## 🚀 Project Structure

```text
/
├── .github/
│   └── workflows/
│       └── static.yaml          // GitHub Pages deployment workflow
├── src/
│   ├── assets/
│   │   ├── img/                 // Images and icons
│   │   └── svg/                 // SVG assets
│   ├── components/
│   │   ├── Certifications.astro // Professional certifications display
│   │   ├── Collaboration.astro  // Work collaborations section
│   │   ├── Contact.astro        // Contact information and links
│   │   ├── Credentials.astro    // Technical credentials and skills
│   │   ├── Footer.astro         // Site footer
│   │   └── Whatsapp.astro       // WhatsApp contact widget
│   ├── data/
│   │   ├── development.js       // Development credentials data
│   │   ├── netsec.js           // Networking & security credentials
│   │   ├── private-cloud.js    // Private cloud credentials
│   │   └── public-cloud.js     // Public cloud credentials
│   ├── layouts/
│   │   └── Layout.astro        // Main page layout template
│   └── pages/
│       └── index.astro         // Homepage
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build production site to `./dist/` with CSS optimization |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 🛠️ Tech Stack

- **Framework**: [Astro](https://astro.build) v4.16.18
- **Styling**: [Bootstrap](https://getbootstrap.com) v5.3.3
- **Build Optimization**: [PurgeCSS](https://purgecss.com) for CSS optimization
- **Deployment**: Automated via GitHub Actions to GitHub Pages
- **TypeScript**: Full TypeScript support with type checking

## 🚀 Deployment

The site is automatically deployed to GitHub Pages using GitHub Actions whenever changes are pushed to the `main` branch. The deployment workflow:

1. Builds the Astro site
2. Optimizes CSS using PurgeCSS to remove unused Bootstrap styles
3. Deploys the optimized build to GitHub Pages

## 📄 License

This project is licensed under the [GNU General Public License v3.0 (GPL-3.0-only)](LICENSE) - see the LICENSE file for details.

## 🔗 Links and Resources

- Deployed site: [giacchetta.github.io](https://giacchetta.github.io)
- Built with [Astro](https://astro.build) v4.x
- Framework documentation: [docs.astro.build](https://docs.astro.build)
