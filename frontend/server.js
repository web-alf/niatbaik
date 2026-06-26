const path = require("path");
const fs = require("fs");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jsx": "text/javascript; charset=utf-8",
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
};

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");

// Cache-bust version derived from the built bundle (changes on every build).
function assetVersion() {
  try {
    const st = fs.statSync(path.join(PUBLIC_DIR, "app.min.js"));
    return String(Math.floor(st.mtimeMs));
  } catch {
    return String(Date.now());
  }
}
const ASSET_VER = assetVersion();

// Global GTM container id, injected STATICALLY into <head> so GTM connects reliably
// (the dynamic inject via /settings/public raced the API call + Tag Assistant →
// "kadang ga terhubung"). Defaults to the org container; set GTM_ID="" to disable.
const GTM_ID = process.env.GTM_ID !== undefined ? process.env.GTM_ID.trim() : "GTM-W452XTN9";

// index.html is small — read once, inject the asset version + GTM container id. When
// GTM_ID is empty, strip the marked GTM blocks so no broken snippet ships.
function indexHtml() {
  let raw = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  raw = raw.replace(/__ASSET_VER__/g, ASSET_VER);
  if (GTM_ID) {
    raw = raw.replace(/__GTM_ID__/g, GTM_ID);
  } else {
    raw = raw
      .replace(/<!--GTM_START-->[\s\S]*?<!--GTM_END-->/g, "")
      .replace(/<!--GTMNS_START-->[\s\S]*?<!--GTMNS_END-->/g, "");
  }
  return raw;
}
let INDEX_HTML = indexHtml();

// Built assets live in public/ and are served immutably (cache-busted via ?v=).
const BUILT_ASSETS = new Set(["/app.min.js", "/app.css", "/app.bundle.js"]);

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    let pathname = url.pathname;

    if (pathname === "/" || pathname === "/index.html") {
      return new Response(INDEX_HTML, {
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" },
      });
    }

    // Built bundle / stylesheet → public/, immutable.
    if (BUILT_ASSETS.has(pathname)) {
      const file = Bun.file(path.join(PUBLIC_DIR, pathname));
      if (await file.exists()) {
        const ext = path.extname(pathname).toLowerCase();
        return new Response(file, {
          headers: {
            "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    }

    const filePath = path.join(ROOT, pathname);

    try {
      const file = Bun.file(filePath);
      const exists = await file.exists();

      if (!exists) {
        // SPA fallback → index.html (with injected asset version).
        return new Response(INDEX_HTML, {
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" },
        });
      }

      const ext = path.extname(pathname).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";

      const headers = { "Content-Type": contentType };
      if (ext === ".png" || ext === ".jpg" || ext === ".jpeg" || ext === ".gif" || ext === ".svg" || ext === ".woff" || ext === ".woff2") {
        headers["Cache-Control"] = "public, max-age=31536000, immutable";
      }

      return new Response(file, { headers });
    } catch {
      return new Response("Not Found", { status: 404 });
    }
  },
});

console.log(`NIATBAIK.ORG frontend running on http://localhost:${PORT} (assets v${ASSET_VER})`);
