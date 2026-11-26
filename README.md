# ai-portfolio

Studio site: an immersive homepage plus clean, readable pages for recruiters and clients. Zero dependencies, so it builds with plain Node.

| Page | Audience | What's there |
| --- | --- | --- |
| `/` | Everyone (the wow page) | Live WebGL aurora hero, words that light up as you scroll, a pinned horizontal project reel, particle type you can move with the cursor, counters |
| `/work/` | Clients, recruiters | Filterable case-study grid. Each project has its own page with metrics, stack and a link to the next project |
| `/writing/` | Everyone | Blog with search, RSS, reading progress bar and a table of contents |
| `/about/` | Recruiters | Short summary card (stack, availability, CV request), principles, team, experience timeline, toolbox, testimonials |
| `/hire/` | Clients | Engagement tiers and pricing, process, FAQ, and a contact form that opens an email with everything filled in |

## Run it

```bash
npm run dev      # build + serve on http://localhost:4321, rebuilds on save
npm run build    # output to dist/
```

Requires Node 18+. Nothing to install.

## Edit content

- **Site name, email, socials, availability:** `site.config.json`
- **New case study:** add `content/work/<slug>.md` (copy an existing one). Frontmatter:
  - `palette: [#hex, #hex, #hex]` + `pattern: orbs|rings|lines|dots` + `glyph` generate the cover art
  - `cover: /assets/img/shot.jpg` uses a real image instead (put files in `src/assets/img/`)
  - `metrics: [41%|less handling time]` uses `value|label` pairs
  - `featured`, `order`, `link`, `draft: true`
- **New blog post:** add `content/posts/<slug>.md` with `title`, `date: YYYY-MM-DD`, `summary`, `tags`.
  Markdown supports headings, lists, code, tables, images, links, raw HTML, `> [!pull]` pull quotes and `> [!note]` callouts.
- **Page copy:** `src/pages/*.html`. **Styles:** `src/assets/css/style.css` (colors are tokens at the top).

> All projects, people, clients, quotes, stats and prices are **placeholders**. Replace them with real ones before you publish.

## Deploy

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to `main`. In the repo, enable it under **Settings → Pages → Source: GitHub Actions**. Subpath hosting (`/ai-portfolio/`) is handled automatically.

Any static host also works (Netlify, Vercel, Cloudflare Pages): use build command `node build.mjs` and output directory `dist`.

## Accessibility & performance

- Respects `prefers-reduced-motion`: the shader stays still, the reel becomes a swipe row, and reveal animations are switched off
- The shader renders at reduced resolution and pauses when it's off screen
- Light and dark themes (the homepage is always dark), keyboard focus styles, a skip link and semantic markup
- No trackers, no frameworks, no client-side routing
