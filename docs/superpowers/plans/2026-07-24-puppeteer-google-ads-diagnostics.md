# Puppeteer Google Ads Diagnostics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture sanitized browser evidence for the Google Ads Test Connection 502 in local and production environments.

**Architecture:** A standalone Node ESM script launches installed Chrome through `puppeteer-core`, uses a temporary browser profile, and observes only `POST /api/settings/google-ads/test`. A pure sanitizer is exported for Node's built-in test runner.

**Tech Stack:** Node.js, `puppeteer-core`, Node `assert`/`node:test`, existing npm frontend tooling.

---

### Task 1: Install and isolate diagnostics

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Modify: `.gitignore`

- [ ] Install without bundled Chromium:

```bash
npm --prefix frontend install --save-dev puppeteer-core
```

- [ ] Add `.diagnostics/` to `.gitignore`.

- [ ] Verify dependency resolution:

```bash
npm --prefix frontend ls puppeteer-core
```

Expected: exit 0.

### Task 2: Build sanitizer via TDD

**Files:**
- Create: `frontend/scripts/google-ads-diagnostics.mjs`
- Create: `frontend/scripts/google-ads-diagnostics.test.mjs`

- [ ] Write a failing `node:test` case importing `sanitizeText` and asserting removal of bearer tokens, cookie values, OAuth secret fields, email, phone, and long numeric IDs while retaining `PERMISSION_DENIED` and normal diagnostic text.

- [ ] Run:

```bash
node --test frontend/scripts/google-ads-diagnostics.test.mjs
```

Expected: FAIL because module/export does not exist.

- [ ] Implement `sanitizeText(value)` with bounded output and deterministic regex replacements. Export it without launching the browser when imported.

- [ ] Re-run the test. Expected: PASS.

### Task 3: Implement visible-browser capture

**Files:**
- Modify: `frontend/scripts/google-ads-diagnostics.mjs`
- Modify: `frontend/package.json`

- [ ] Parse required URL from `--url`; accept only `http://localhost`, `http://127.0.0.1`, or HTTPS.

- [ ] Detect Chrome from `CHROME_PATH` then standard macOS paths. Fail clearly if absent.

- [ ] Launch headful Chrome with a temporary profile, navigate to supplied URL, print manual login/click instructions, and wait up to five minutes for matching POST response.

- [ ] Capture status, content type, duration, sanitized body, sanitized console errors, and screenshot under `frontend/.diagnostics/google-ads/`.

- [ ] Close browser and remove temporary profile in `finally`.

- [ ] Add script:

```json
"diagnose:google-ads": "node scripts/google-ads-diagnostics.mjs"
```

### Task 4: Verify

- [ ] Run sanitizer tests:

```bash
node --test frontend/scripts/google-ads-diagnostics.test.mjs
```

- [ ] Run production build:

```bash
npm --prefix frontend run build
```

- [ ] Verify ignored artifacts:

```bash
git check-ignore frontend/.diagnostics/google-ads/test.json
```

- [ ] Run local diagnostic against the available local URL, log in manually, click Test Connection, then inspect sanitized output.

- [ ] Run production diagnostic only after local capture is safe. Do not paste credentials into the terminal or script.