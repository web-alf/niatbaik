const path = require("path");

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

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    let pathname = url.pathname;

    if (pathname === "/") pathname = "/index.html";

    const filePath = path.join(ROOT, pathname);

    try {
      const file = Bun.file(filePath);
      const exists = await file.exists();

      if (!exists) {
        const indexFile = Bun.file(path.join(ROOT, "index.html"));
        return new Response(indexFile, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
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

console.log(`NIATBAIK.ORG frontend running on http://localhost:${PORT}`);
