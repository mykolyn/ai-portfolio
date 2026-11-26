// Tiny dev server: builds, serves ./dist, and rebuilds when sources change.
//   node serve.mjs            → http://localhost:4321
//   PORT=8080 node serve.mjs
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, "dist");
const PORT = Number(process.env.PORT) || 4321;
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif",
  ".xml": "application/xml", ".json": "application/json", ".pdf": "application/pdf", ".woff2": "font/woff2", ".mp4": "video/mp4" };

const build = () => {
  try { execFileSync(process.execPath, [path.join(ROOT, "build.mjs")], { stdio: "inherit" }); }
  catch { console.error("✗ Build failed"); }
};
build();

if (!process.argv.includes("--no-watch")) {
  let t;
  for (const dir of ["src", "content", "public"]) {
    const full = path.join(ROOT, dir);
    if (fs.existsSync(full)) fs.watch(full, { recursive: true }, () => { clearTimeout(t); t = setTimeout(build, 80); });
  }
  fs.watch(path.join(ROOT, "site.config.json"), () => { clearTimeout(t); t = setTimeout(build, 80); });
}

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file = path.join(DIST, p);
  if (!file.startsWith(DIST)) { res.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file)) { res.writeHead(404, { "content-type": TYPES[".html"] }); fs.createReadStream(path.join(DIST, "404.html")).pipe(res); return; }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream", "cache-control": "no-store" });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`→ http://localhost:${PORT}`));
