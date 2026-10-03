// Self-check for server.js LCP preload: `bun scripts/hero-preload.test.mjs` (needs dist/).
// Fake API on :18080, frontend on :13000. Asserts the preload tag only on /c/:slug with a
// safe filename, never on other pages, never with an unsafe name.
Bun.serve({
  port: 18080,
  fetch(req) {
    const p = new URL(req.url).pathname;
    if (p === '/api/campaigns/ok') return Response.json({ data: { image: 'abc.webp' } });
    if (p === '/api/campaigns/evil') return Response.json({ data: { image: '../x"><script>' } });
    return new Response('nf', { status: 404 });
  },
});
process.env.PORT = '13000';
process.env.API_URL = 'http://localhost:18080';
await import('../server.js');

const get = async (p) => (await fetch('http://localhost:13000' + p)).text();
const [ok, bad, nf, root] = await Promise.all(['/c/ok', '/c/evil', '/c/none', '/'].map(get));

let fail = 0;
const check = (cond, msg) => { if (!cond) { fail++; console.error('FAIL', msg); } };
check(ok.includes('<link rel="preload" as="image" href="/uploads/abc.webp"'), 'preload missing on /c/ok');
check(!bad.includes('rel="preload"'), 'unsafe image name leaked');
check(!nf.includes('rel="preload"'), 'preload on unknown slug');
check(!root.includes('rel="preload"'), 'preload on /');
console.log(fail ? `${fail} FAILED` : 'ALL PASS');
process.exit(fail ? 1 : 0);
