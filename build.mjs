// Zero-dependency static site builder.
//   node build.mjs            → builds into ./dist
//   BASE_PATH=/repo/ node build.mjs   → for GitHub Pages project sites
//
// Sources:
//   src/layouts/*.html   shared shells (base, post, case-study)
//   src/pages/*.html     top-level pages (frontmatter + HTML)
//   content/work/*.md    case studies
//   content/posts/*.md   blog posts
//   src/assets/**        copied as-is to dist/assets
//   public/**            copied as-is to dist/

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, "src");
const OUT = path.join(ROOT, "dist");
const config = JSON.parse(fs.readFileSync(path.join(ROOT, "site.config.json"), "utf8"));

let base = process.env.BASE_PATH || "/";
if (!base.startsWith("/")) base = "/" + base;
if (!base.endsWith("/")) base += "/";
const siteUrl = (process.env.SITE_URL || config.url).replace(/\/$/, "");

// ---------------------------------------------------------------- helpers

const read = (p) => fs.readFileSync(p, "utf8");
const escapeHtml = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const slugify = (s) =>
  String(s).toLowerCase().replace(/<[^>]+>/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function writeFile(rel, contents) {
  const dest = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, contents);
}

function copyDir(from, to) {
  if (!fs.existsSync(from)) return;
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, entry.name);
    const d = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else {
      fs.mkdirSync(path.dirname(d), { recursive: true });
      fs.copyFileSync(s, d);
    }
  }
}

/** Parse `---` frontmatter. Values may be strings, `[a, b]` lists, or true/false/numbers. */
function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, body: raw };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kv) continue;
    let [, key, val] = kv;
    val = val.trim();
    if (/^\[.*\]$/.test(val)) {
      val = val.slice(1, -1).split(",").map((v) => v.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    } else if (val === "true" || val === "false") {
      val = val === "true";
    } else if (/^-?\d+(\.\d+)?$/.test(val)) {
      val = Number(val);
    } else {
      val = val.replace(/^["']|["']$/g, "");
    }
    data[key] = val;
  }
  return { data, body: raw.slice(m[0].length) };
}

// ---------------------------------------------------------------- markdown

function inline(text) {
  const codes = [];
  let s = text.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(`<code>${escapeHtml(c)}</code>`);
    return `\u0000${codes.length - 1}\u0000`;
  });
  s = s
    .replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_, alt, src, title) =>
      `<img src="${resolveUrl(src)}" alt="${escapeHtml(alt)}" loading="lazy"${title ? ` title="${escapeHtml(title)}"` : ""}>`)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
      const ext = /^https?:/.test(href);
      return `<a href="${resolveUrl(href)}"${ext ? ' target="_blank" rel="noopener"' : ""}>${label}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^\w*])\*([^*\n]+)\*(?!\w)/g, "$1<em>$2</em>")
    .replace(/(^|[^\w])_([^_\n]+)_(?!\w)/g, "$1<em>$2</em>")
    .replace(/ -- /g, " — ");
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => codes[Number(i)]);
}

function resolveUrl(href) {
  if (href.startsWith("/") && !href.startsWith("//")) return base + href.slice(1);
  return href;
}

function markdown(src) {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  const toc = [];
  let i = 0;
  const isBlank = (l) => /^\s*$/.test(l);
  const startsBlock = (l) =>
    /^(#{1,6}\s|```|>\s?|\|.*\||[-*+]\s|\d+\.\s|(-{3,}|\*{3,})\s*$|<(div|figure|aside|section|table|iframe|video|details|svg|p)\b)/.test(l);

  while (i < lines.length) {
    const line = lines[i];
    if (isBlank(line)) { i++; continue; }

    // fenced code
    const fence = line.match(/^```\s*([\w+-]*)/);
    if (fence) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      const lang = fence[1];
      out.push(`<pre class="code"${lang ? ` data-lang="${lang}"` : ""}><code>${escapeHtml(buf.join("\n"))}</code></pre>`);
      continue;
    }

    // heading
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const html = inline(h[2]);
      const id = slugify(h[2]);
      if (level === 2) toc.push({ id, text: h[2].replace(/[*_`]/g, "") });
      out.push(`<h${level} id="${id}">${html}</h${level}>`);
      i++;
      continue;
    }

    // hr
    if (/^(-{3,}|\*{3,})\s*$/.test(line)) { out.push("<hr>"); i++; continue; }

    // blockquote (supports "> [!pull]" for pull quotes)
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ""));
      let cls = "";
      if (/^\[!pull\]/.test(buf[0])) { cls = ' class="pull"'; buf[0] = buf[0].replace(/^\[!pull\]\s*/, ""); }
      if (/^\[!note\]/.test(buf[0])) { cls = ' class="note"'; buf[0] = buf[0].replace(/^\[!note\]\s*/, ""); }
      out.push(`<blockquote${cls}>${markdown(buf.join("\n")).html}</blockquote>`);
      continue;
    }

    // lists
    if (/^([-*+]|\d+\.)\s/.test(line)) {
      const ordered = /^\d+\./.test(line);
      const items = [];
      while (i < lines.length && /^([-*+]|\d+\.)\s/.test(lines[i])) {
        let item = lines[i++].replace(/^([-*+]|\d+\.)\s+/, "");
        while (i < lines.length && /^\s{2,}\S/.test(lines[i])) item += " " + lines[i++].trim();
        items.push(`<li>${inline(item)}</li>`);
      }
      const tag = ordered ? "ol" : "ul";
      out.push(`<${tag}>${items.join("")}</${tag}>`);
      continue;
    }

    // table
    if (/^\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      const cells = (l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => inline(c.trim()));
      const head = cells(line);
      i += 2;
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(cells(lines[i++]));
      out.push(
        `<div class="table-wrap"><table><thead><tr>${head.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${rows
          .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
          .join("")}</tbody></table></div>`
      );
      continue;
    }

    // raw html block
    if (/^<[a-zA-Z]/.test(line)) {
      const buf = [];
      while (i < lines.length && !isBlank(lines[i])) buf.push(lines[i++]);
      out.push(buf.join("\n"));
      continue;
    }

    // paragraph
    const buf = [];
    while (i < lines.length && !isBlank(lines[i]) && !startsBlock(lines[i])) buf.push(lines[i++]);
    out.push(`<p>${inline(buf.join(" "))}</p>`);
  }
  return { html: out.join("\n"), toc };
}

// ---------------------------------------------------------------- templating

function render(template, data) {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key) => {
    const v = key.split(".").reduce((o, k) => (o == null ? undefined : o[k]), data);
    return v == null ? "" : String(v);
  });
}

const layouts = {};
for (const f of fs.readdirSync(path.join(SRC, "layouts"))) {
  layouts[path.basename(f, ".html")] = read(path.join(SRC, "layouts", f));
}

function navHtml(current) {
  return config.nav
    .map((n) => {
      const active = current && n.href.startsWith(current);
      return `<a href="${base}${n.href}" class="nav-link${n.href === "hire/" ? " nav-cta" : ""}"${active ? ' aria-current="page"' : ""}>${n.label}</a>`;
    })
    .join("");
}

const socialsHtml = config.socials
  .map((s) => `<a href="${s.href}" target="_blank" rel="noopener">${s.label}</a>`)
  .join("");

function page({ title, description, content, bodyClass = "", current = "", urlPath = "", extraHead = "", scripts = "", ogType = "website" }) {
  const fullTitle = title ? `${title} — ${config.name}` : `${config.name} — ${config.tagline}`;
  return render(layouts.base, {
    ...config,
    base,
    title: escapeHtml(fullTitle),
    description: escapeHtml(description || config.description),
    canonical: `${siteUrl}/${urlPath}`,
    ogType,
    content,
    bodyClass,
    nav: navHtml(current),
    socials: socialsHtml,
    year: new Date().getFullYear(),
    extraHead,
    scripts,
  });
}

// ---------------------------------------------------------------- content

function loadCollection(dir) {
  const full = path.join(ROOT, "content", dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map((f) => {
      const { data, body } = parseFrontmatter(read(path.join(full, f)));
      const { html, toc } = markdown(body);
      const words = body.split(/\s+/).filter(Boolean).length;
      return { ...data, slug: data.slug || path.basename(f, ".md"), html, toc, words, readingTime: Math.max(1, Math.round(words / 230)) };
    })
    .filter((x) => !x.draft);
}

const work = loadCollection("work").sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || String(b.year).localeCompare(String(a.year)));
const posts = loadCollection("posts").sort((a, b) => String(b.date).localeCompare(String(a.date)));

const fmtDate = (d) =>
  new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });

const asList = (v) => (Array.isArray(v) ? v : v ? String(v).split(",").map((s) => s.trim()) : []);

function coverStyle(w) {
  const [c1, c2, c3] = asList(w.palette).length ? asList(w.palette) : ["#ff6a3d", "#7b5cff", "#16c2a3"];
  return `--c1:${c1};--c2:${c2 || c1};--c3:${c3 || c2 || c1}`;
}

function cover(w, size = "") {
  if (w.cover) {
    return `<div class="cover ${size}" style="${coverStyle(w)}"><img src="${resolveUrl(w.cover)}" alt="" loading="lazy"></div>`;
  }
  return `<div class="cover cover--gen cover--${w.pattern || "orbs"} ${size}" style="${coverStyle(w)}" aria-hidden="true">
    <span class="cover__blob cover__blob--1"></span><span class="cover__blob cover__blob--2"></span><span class="cover__blob cover__blob--3"></span>
    <span class="cover__grid"></span><span class="cover__glyph">${escapeHtml(w.glyph || w.title.slice(0, 1))}</span>
  </div>`;
}

function workCard(w, i) {
  const tags = asList(w.tags).map((t) => `<li>${escapeHtml(t)}</li>`).join("");
  return `<article class="work-card reveal" data-tags="${escapeHtml(asList(w.tags).join("|").toLowerCase())}" style="--i:${i}">
  <a href="${base}work/${w.slug}/" class="work-card__link">
    ${cover(w)}
    <div class="work-card__meta">
      <div class="work-card__top"><span class="eyebrow">${escapeHtml(w.client || "")}</span><span class="mono dim">${escapeHtml(w.year || "")}</span></div>
      <h3 class="work-card__title">${escapeHtml(w.title)}</h3>
      <p class="work-card__summary">${escapeHtml(w.summary || "")}</p>
      <ul class="tags">${tags}</ul>
    </div>
  </a>
</article>`;
}

function postRow(p) {
  return `<li class="post-row reveal">
  <a href="${base}writing/${p.slug}/">
    <time class="mono dim" datetime="${p.date}">${fmtDate(p.date)}</time>
    <div class="post-row__body">
      <h3>${escapeHtml(p.title)}</h3>
      <p>${escapeHtml(p.summary || "")}</p>
    </div>
    <span class="post-row__meta mono dim">${p.readingTime} min</span>
    <span class="post-row__arrow" aria-hidden="true">→</span>
  </a>
</li>`;
}

function metricsHtml(w) {
  const metrics = asList(w.metrics);
  if (!metrics.length) return "";
  return `<dl class="metrics">${metrics
    .map((m) => {
      const [v, l] = m.split("|");
      return `<div><dt>${escapeHtml(l || "")}</dt><dd>${escapeHtml(v)}</dd></div>`;
    })
    .join("")}</dl>`;
}

const allTags = [...new Set(work.flatMap((w) => asList(w.tags)))].sort();

const blocks = {
  workList: work.map(workCard).join("\n"),
  featuredWork: work.filter((w) => w.featured).slice(0, 4).map(workCard).join("\n"),
  workFilters: ["All", ...allTags]
    .map((t, i) => `<button class="chip${i === 0 ? " is-active" : ""}" data-filter="${i === 0 ? "*" : escapeHtml(t.toLowerCase())}">${escapeHtml(t)}</button>`)
    .join(""),
  postList: posts.map(postRow).join("\n"),
  latestPosts: posts.slice(0, 3).map(postRow).join("\n"),
  showcase: work
    .slice(0, 6)
    .map(
      (w, i) => `<a class="showcase__item" href="${base}work/${w.slug}/" style="--i:${i}">
      ${cover(w)}
      <span class="showcase__caption"><span class="mono">0${i + 1}</span><strong>${escapeHtml(w.title)}</strong><span class="dim">${escapeHtml(w.client || "")}</span></span>
    </a>`
    )
    .join(""),
  workCount: work.length,
  postCount: posts.length,
};

// ---------------------------------------------------------------- build

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
copyDir(path.join(SRC, "assets"), path.join(OUT, "assets"));
copyDir(path.join(ROOT, "public"), OUT);

// Top-level pages
for (const f of fs.readdirSync(path.join(SRC, "pages"))) {
  if (!f.endsWith(".html")) continue;
  const name = path.basename(f, ".html");
  const { data, body } = parseFrontmatter(read(path.join(SRC, "pages", f)));
  const urlPath = name === "index" ? "" : name === "404" ? "404.html" : `${name}/`;
  const outPath = name === "index" ? "index.html" : name === "404" ? "404.html" : `${name}/index.html`;
  const content = render(body, { ...config, ...blocks, base });
  writeFile(
    outPath,
    page({
      title: data.title,
      description: data.description,
      content,
      bodyClass: data.bodyClass || `page-${name}`,
      current: name === "index" ? "" : `${name}/`,
      urlPath,
      scripts: data.scripts ? asList(data.scripts).map((s) => `<script type="module" src="${base}assets/js/${s}"></script>`).join("\n") : "",
    })
  );
}

// Case studies
work.forEach((w, idx) => {
  const next = work[(idx + 1) % work.length];
  const content = render(layouts["case-study"], {
    ...config,
    base,
    ...w,
    title: escapeHtml(w.title),
    summary: escapeHtml(w.summary || ""),
    cover: cover(w, "cover--hero"),
    metrics: metricsHtml(w),
    tags: asList(w.tags).map((t) => `<li>${escapeHtml(t)}</li>`).join(""),
    stack: asList(w.stack).map((t) => `<li>${escapeHtml(t)}</li>`).join(""),
    nextTitle: escapeHtml(next.title),
    nextSlug: next.slug,
    nextCover: cover(next),
    link: w.link ? `<a class="btn btn--ghost" href="${w.link}" target="_blank" rel="noopener">Visit live project ↗</a>` : "",
  });
  writeFile(
    `work/${w.slug}/index.html`,
    page({ title: w.title, description: w.summary, content, bodyClass: "page-case", current: "work/", urlPath: `work/${w.slug}/`, ogType: "article" })
  );
});

// Posts
posts.forEach((p, idx) => {
  const newer = posts[idx - 1];
  const older = posts[idx + 1];
  const toc = p.toc.length > 2
    ? `<nav class="toc" aria-label="On this page"><p class="eyebrow">On this page</p><ol>${p.toc.map((t) => `<li><a href="#${t.id}">${escapeHtml(t.text)}</a></li>`).join("")}</ol></nav>`
    : "";
  const content = render(layouts.post, {
    ...config,
    base,
    ...p,
    title: escapeHtml(p.title),
    summary: escapeHtml(p.summary || ""),
    date: fmtDate(p.date),
    isoDate: p.date,
    tags: asList(p.tags).map((t) => `<li>${escapeHtml(t)}</li>`).join(""),
    author: escapeHtml(p.author || config.name),
    toc,
    pager: [
      older ? `<a class="pager__prev" href="${base}writing/${older.slug}/"><span class="eyebrow">← Older</span><strong>${escapeHtml(older.title)}</strong></a>` : "<span></span>",
      newer ? `<a class="pager__next" href="${base}writing/${newer.slug}/"><span class="eyebrow">Newer →</span><strong>${escapeHtml(newer.title)}</strong></a>` : "<span></span>",
    ].join(""),
  });
  writeFile(
    `writing/${p.slug}/index.html`,
    page({ title: p.title, description: p.summary, content, bodyClass: "page-post", current: "writing/", urlPath: `writing/${p.slug}/`, ogType: "article" })
  );
});

// RSS
const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${escapeHtml(config.name)} — Writing</title>
  <link>${siteUrl}/writing/</link>
  <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
  <description>${escapeHtml(config.description)}</description>
${posts
  .map(
    (p) => `  <item>
    <title>${escapeHtml(p.title)}</title>
    <link>${siteUrl}/writing/${p.slug}/</link>
    <guid>${siteUrl}/writing/${p.slug}/</guid>
    <pubDate>${new Date(p.date + "T12:00:00Z").toUTCString()}</pubDate>
    <description>${escapeHtml(p.summary || "")}</description>
  </item>`
  )
  .join("\n")}
</channel>
</rss>`;
writeFile("feed.xml", rss);

// Sitemap
const urls = ["", "work/", "writing/", "about/", "hire/", ...work.map((w) => `work/${w.slug}/`), ...posts.map((p) => `writing/${p.slug}/`)];
writeFile(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${siteUrl}/${u}</loc></url>`).join("\n")}\n</urlset>`
);
writeFile(".nojekyll", "");

console.log(`✓ Built ${work.length} case studies, ${posts.length} posts → dist/ (base: ${base})`);
