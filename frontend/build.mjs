// Build step: transpile JSX → JS, wrap each file in its own IIFE (to mirror
// the per-<script> scope isolation @babel/standalone gave us at runtime), and
// concat into a single bundle. esbuild then minifies the already-valid JS.
//
// IMPORTANT: load order must match the original <script> order in index.html —
// cross-file symbols resolve via window globals at execute time.
import { transformFileSync } from '@babel/core';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const srcDir = join(root, 'src');
const outDir = join(root, 'public');

const FILES = [
  'api.jsx','data.jsx','icons.jsx','components.jsx',
  'views/dashboard.jsx','views/campaigns.jsx','views/campaign-editor.jsx','views/analytics.jsx',
  'views/advertiser.jsx','views/data-studio.jsx','views/cs-inbox.jsx','views/fundraiser.jsx',
  'views/members.jsx','views/profile.jsx','views/settings.jsx',
  'views/notifications.jsx','views/trash.jsx','views/ads-guide.jsx',
  'public/public-app.jsx','login.jsx','app.jsx',
];

mkdirSync(outDir, { recursive: true });

let bundle = '"use strict";\n';
for (const f of FILES) {
  const { code } = transformFileSync(join(srcDir, f), {
    presets: [['@babel/preset-react']],
    babelrc: false,
    configFile: false,
    compact: false,
    comments: false,
  });
  // IIFE wrap → each file gets its own top-level scope, exactly like a separate
  // <script>. This is why duplicate `const { useState: uS } = React` is safe.
  bundle += `\n;(function(){\n${code}\n})();\n`;
}

const bundlePath = join(outDir, 'app.bundle.js');
writeFileSync(bundlePath, bundle);
console.log(`[build] wrote ${bundlePath} (${(bundle.length / 1024).toFixed(0)} KB)`);

// Minify with esbuild (minify only — bundle is already valid concatenated JS).
const minPath = join(outDir, 'app.min.js');
execFileSync('bunx', ['esbuild', bundlePath, '--minify', '--target=es2018', `--outfile=${minPath}`], {
  stdio: 'inherit',
  cwd: root,
});
console.log(`[build] wrote ${minPath}`);

// Build Tailwind CSS → public/app.css
execFileSync('bunx', ['tailwindcss', '-c', 'tailwind.config.js', '-i', 'styles/input.css', '-o', join(outDir, 'app.css'), '--minify'], {
  stdio: 'inherit', cwd: root,
});
console.log('[build] wrote public/app.css');
