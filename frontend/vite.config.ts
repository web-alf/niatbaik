import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// inlineCss swaps the <link rel=stylesheet> for a <style> block holding the whole
// bundle (~16 KiB gz). Removes the one render-blocking request: every deploy changes
// the asset hash, so Cloudflare edges are cold (cf-cache-status: MISS, ~300 ms) for
// each new PoP. Cost: HTML grows by 16 KiB gz per full navigation (SPA nav unaffected).
// CSP already allows style-src 'unsafe-inline'.
// ponytail: inlines ALL css; if a second CSS chunk ever appears (route-level css),
// limit to the entry chunk only.
function inlineCss(): Plugin {
  return {
    name: 'nb-inline-css', apply: 'build', enforce: 'post',
    generateBundle(_, bundle) {
      const html = bundle['index.html'];
      if (!html || html.type !== 'asset') return;
      let src = String(html.source);
      for (const [name, chunk] of Object.entries(bundle)) {
        if (chunk.type !== 'asset' || !name.endsWith('.css')) continue;
        const tag = new RegExp(`<link[^>]*href="/${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`);
        if (!tag.test(src)) continue;
        src = src.replace(tag, `<style>${chunk.source}</style>`);
        delete bundle[name];
      }
      html.source = src;
    },
  };
}

// CSR SPA. Dev proxies /api + /uploads to the Go backend on :8080 so the browser
// hits one origin (no CORS in dev) and api.ts can use relative '/api' everywhere.
export default defineConfig({
  plugins: [react(), inlineCss()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  build: { outDir: 'dist', assetsDir: 'assets', sourcemap: false },
  server: {
    port: 3000,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/uploads': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
});
