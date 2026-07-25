import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function sanitizeText(value) {
  return String(value ?? '')
    .replace(/Bearer\s+[^\s"']+/gi, 'Bearer [REDACTED]')
    .replace(/Cookie:\s*[^\r\n]+/gi, 'Cookie: [REDACTED]')
    .replace(/\b(client_secret|refresh_token|access_token|password)\b\s*[:=]\s*[^\s&"']+/gi, '$1=[REDACTED]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]')
    .replace(/\+?\d[\d\s().-]{8,}\d/g, '[REDACTED_NUMBER]')
    .slice(0, 10000);
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : '';
}

function targetURL(raw) {
  const url = new URL(raw);
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) {
    throw new Error('URL harus HTTPS atau localhost HTTP');
  }
  return url;
}

function chromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ].filter(Boolean);
  return candidates.find(existsSync) || '';
}

async function run() {
  const url = targetURL(argument('--url'));
  const executablePath = chromePath();
  if (!executablePath) throw new Error('Chrome tidak ditemukan; set CHROME_PATH');

  const { default: puppeteer } = await import('puppeteer-core');
  const profile = await mkdtemp(path.join(tmpdir(), 'niatbaik-diagnostics-'));
  const outputDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.diagnostics/google-ads');
  await mkdir(outputDir, { recursive: true });
  const started = new Map();
  const consoleErrors = [];
  let browser;

  try {
    browser = await puppeteer.launch({ headless: false, executablePath, userDataDir: profile });
    const [page] = await browser.pages();
    page.on('request', request => {
      const requestURL = new URL(request.url());
      if (request.method() === 'POST' && requestURL.pathname.endsWith('/api/settings/google-ads/test')) {
        started.set(request, Date.now());
      }
    });
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(sanitizeText(message.text()));
    });

    console.log('Login manual, buka Google Ads settings, lalu klik Test Connection. Menunggu maksimal 5 menit.');
    await page.goto(url.href, { waitUntil: 'domcontentloaded' });
    const response = await page.waitForResponse(candidate => {
      const request = candidate.request();
      return request.method() === 'POST' && new URL(candidate.url()).pathname.endsWith('/api/settings/google-ads/test');
    }, { timeout: 300000 });

    const request = response.request();
    const body = sanitizeText(await response.text().catch(() => '[unreadable response]'));
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const environment = url.hostname === 'localhost' || url.hostname === '127.0.0.1' ? 'local' : 'production';
    const base = `${environment}-${stamp}`;
    const evidence = {
      environment,
      origin: url.origin,
      request: { method: request.method(), pathname: new URL(request.url()).pathname },
      response: {
        status: response.status(),
        contentType: response.headers()['content-type'] || '',
        durationMs: Date.now() - (started.get(request) || Date.now()),
        body,
      },
      consoleErrors,
    };
    await writeFile(path.join(outputDir, `${base}.json`), `${JSON.stringify(evidence, null, 2)}\n`, { mode: 0o600 });
    await page.screenshot({ path: path.join(outputDir, `${base}.png`), fullPage: true });
    console.log(JSON.stringify(evidence, null, 2));
    console.log(`Artefak: ${path.join(outputDir, base)}.{json,png}`);
  } finally {
    await browser?.close();
    await rm(profile, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch(error => {
    console.error(sanitizeText(error.message));
    process.exitCode = 1;
  });
}
