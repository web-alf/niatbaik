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

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname;

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

    // SPA fallback → index.html (with injected GTM). React Router resolves the route.
    return new Response(INDEX_HTML, {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" },
    });
  },
});

console.log(`NIATBAIK.ORG frontend running on http://localhost:${PORT}`);
