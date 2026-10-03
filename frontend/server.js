const path = require("path");
const fs = require("fs");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".map": "application/json",
};

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DIST_DIR = path.join(ROOT, "dist");

// Global GTM container id, injected STATICALLY into <head> so GTM connects reliably
// (the dynamic inject via /settings/public raced the API call + Tag Assistant →
// "kadang ga terhubung"). Defaults to the org container; set GTM_ID="" to disable.
// Vite content-hashes its assets, so there's no asset-version placeholder anymore.
const GTM_ID = process.env.GTM_ID !== undefined ? process.env.GTM_ID.trim() : "GTM-W452XTN9";

// dist/index.html is small — read once, inject the GTM container id. When GTM_ID is
// empty, strip the marked GTM blocks so no broken snippet ships.
function indexHtml() {
  let raw = fs.readFileSync(path.join(DIST_DIR, "index.html"), "utf8");
  if (GTM_ID) {
    raw = raw.replace(/__GTM_ID__/g, GTM_ID);
  } else {
    raw = raw
      .replace(/<!--GTM_START-->[\s\S]*?<!--GTM_END-->/g, "")
      .replace(/<!--GTMNS_START-->[\s\S]*?<!--GTMNS_END-->/g, "");
  }
  return raw;
}
const INDEX_HTML = indexHtml();

// LCP hint for /c/:slug. A CSR SPA only learns the hero URL after JS + API (~900 ms
// "resource load delay"). Ask the API for the campaign here, inject
// <link rel=preload as=image> into <head>, and the browser starts the hero fetch from
// byte 0. Soft-fails to plain HTML on any error/timeout; cached 60 s per slug.
// ponytail: in-memory Map cache (one process); fine until multiple frontend replicas.
const API_URL = (process.env.API_URL || "http://api:8080").replace(/\/$/, "");
const heroCache = new Map(); // slug -> { href, at }
async function heroHref(slug) {
  if (!/^[\w-]{1,200}$/.test(slug)) return "";
  const hit = heroCache.get(slug);
  if (hit && Date.now() - hit.at < 60_000) return hit.href;
  let href = "";
  try {
    const res = await fetch(`${API_URL}/api/campaigns/${slug}`, { signal: AbortSignal.timeout(400) });
    const img = res.ok ? (await res.json())?.data?.image : "";
    const name = typeof img === "string" ? img.replace(/^\/?uploads\//, "") : "";
    if (/^[\w.-]+$/.test(name)) href = "/uploads/" + name;
  } catch { /* soft-fail */ }
  heroCache.set(slug, { href, at: Date.now() });
  return href;
}
function withHero(href) {
  if (!href) return INDEX_HTML;
  return INDEX_HTML.replace("<head>", `<head><link rel="preload" as="image" href="${href}" fetchpriority="high">`);
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname;

    const camp = pathname.match(/^\/c\/([^/]+)\/?$/);
    if (camp) {
      return new Response(withHero(await heroHref(decodeURIComponent(camp[1]))), {
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" },
      });
    }

    if (pathname === "/" || pathname === "/index.html") {
      return new Response(INDEX_HTML, {
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" },
      });
    }

    // Serve any real file under dist/ (Vite output: /assets/*, /assets/logo, etc).
    const filePath = path.join(DIST_DIR, pathname);
    // Guard against path traversal escaping dist/.
    if (!filePath.startsWith(DIST_DIR)) {
      return new Response("Forbidden", { status: 403 });
    }

    try {
      const file = Bun.file(filePath);
      if (await file.exists()) {
        const ext = path.extname(pathname).toLowerCase();
        const headers = { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" };
        // Vite content-hashes /assets/* filenames, so they're safe to cache forever.
        if (pathname.startsWith("/assets/")) {
          headers["Cache-Control"] = "public, max-age=31536000, immutable";
        }
        return new Response(file, { headers });
      }
    } catch { /* fall through to SPA fallback */ }

    // Missing file with an extension (/foo.json, /x.txt) → real 404, not HTML.
    // Otherwise crawlers/validators parse index.html as JSON/robots and report garbage.
    if (path.extname(pathname)) return new Response("Not Found", { status: 404 });

    // SPA fallback → index.html (with injected GTM). React Router resolves the route.
    return new Response(INDEX_HTML, {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" },
    });
  },
});

console.log(`NIATBAIK.ORG frontend running on http://localhost:${PORT}`);
