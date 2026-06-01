# NiatBaik Frontend Redesign v2.6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faithfully re-port the canonical Claude Design admin console + public site into `frontend/`, keeping the working `api.jsx` layer and Bun/esbuild build, and extend the Go backend to support every view.

**Architecture:** Single-page React app (no build-time JSX in browser). `build.mjs` babel-transpiles each `src/*.jsx`, IIFE-wraps it, concatenates in dependency order, esbuild-minifies → `public/app.min.js`. Cross-file symbols resolve via `window` globals at runtime. One `index.html` SPA serves both public routes (`landing`, `campaign-detail`) and the authenticated console; `app.jsx` switches on route. Tailwind is statically built (`tailwind.config.js` + `styles/input.css` → `public/app.css`). Backend is Go/Echo/GORM; additions are new handlers/repos/services/routes + idempotent migrations.

**Tech Stack:** React 18 (UMD), Tailwind CSS (static build), Bun (`bunx esbuild`, `Bun.serve`), Go 1.x (Echo v4, GORM, Postgres 16), Docker.

**Canonical design source (committed reference):** `docs/superpowers/design-ref/` — `src/` (per-view JSX), `index.html`, `public.html`, `README.md`, `chats/`. **This is the visual source of truth. Match it pixel-for-pixel; do not invent UI.**

**Spec:** `docs/superpowers/specs/2026-06-01-frontend-redesign-v2-design.md`

---

## Conventions for every task

- **Branch:** all work on `redesign/v2-console` (already created from `dev`).
- **Re-port rule:** copy markup/logic from `docs/superpowers/design-ref/src/<file>` verbatim, then rewire any data source to `window.NB` seed + the `loadX()` API loaders in `data.jsx`. Never invent styles.
- **Window-global model:** components are defined at file top-level and attached to `window` at file bottom (`Object.assign(window, {...})` or `window.X = X`). A view uses `Card`, `Btn`, etc. as bare globals — they exist because `components.jsx` ran earlier in `FILES`.
- **Crash-proofing:** every view reads from seed first, overlays API. Guard every `.map`/property access against `null`/`undefined`. A view must render with zero API connectivity.
- **Token names:** the design uses `brand-*`, `sky2-*`, `ink`, `mute`, `line`, `bg2`, `ok/warn/bad`, `shadow-card`, `shadow-pop`, `rounded-xl2`. These all exist in `frontend/tailwind.config.js`. If a ported class uses a token not in the config (e.g. `violet-*`, `emerald-*`, `rose-*`, `amber-*` are Tailwind defaults — fine), confirm it resolves; add to config only if it's a custom token.
- **Logo path:** design uses `assets/logo.png`; repo has `frontend/assets/logo-niatbaik.png`. The `Logo` component must point at the repo asset (`/assets/logo-niatbaik.png`).
- **Build check after frontend tasks:** `cd frontend && bun install` (first time) then `node build.mjs`. Expected: `[build] wrote .../app.min.js` with no babel/esbuild error.
- **Build check after backend tasks:** `cd backend && go build ./... && go vet ./...`. Expected: no output, exit 0.
- **Commit after each task.** Messages: `feat:`/`fix:`/`refactor:` + scope.

---

## File Structure (target)

```
frontend/
  index.html              MODIFY  (single SPA shell; already migrated to /app.min.js)
  build.mjs               MODIFY  (new FILES array, views/ paths)
  tailwind.config.js      MODIFY if tokens missing
  styles/input.css        KEEP    (+ custom keyframes/dark overrides moved out of index.html if needed)
  server.js               KEEP
  assets/logo-niatbaik.png KEEP
  src/
    api.jsx               KEEP    (fetch + JWT)
    data.jsx              MODIFY  (extend seeds + loaders for new views)
    icons.jsx             MODIFY  (merge full design icon set)
    components.jsx        REWRITE (port design components.jsx, fix logo path)
    login.jsx             REWRITE (port design LoginScreen → real /auth/login)
    app.jsx               REWRITE (port design shell: sidebar/topbar/usermenu/routing/guard)
    views/
      dashboard.jsx        CREATE
      campaigns.jsx        CREATE
      campaign-editor.jsx  CREATE
      analytics.jsx        CREATE
      advertiser.jsx       CREATE
      data-studio.jsx      CREATE
      cs-inbox.jsx         CREATE
      fundraiser.jsx       CREATE
      shortcode.jsx        CREATE
      members.jsx          CREATE
      profile.jsx          CREATE
      settings.jsx         CREATE
      notifications.jsx    CREATE
      trash.jsx            CREATE
      ads-guide.jsx        CREATE
    public/
      public-app.jsx       CREATE (landing + campaign detail + donation flow)
  (DELETE after migration: src/pages-admin.jsx, src/pages-cs-adv.jsx,
   src/pages-misc.jsx, src/settings.jsx, src/pages-public.jsx)

backend/internal/
  model/payment_method.go        MODIFY (+AccountName, +GatewayConfig, +IsDefault)
  model/setting.go               MODIFY (+ads tracking / event / moota-flip detail cols)
  repository/payment_method_repo.go   CREATE
  repository/datastudio_repo.go       CREATE
  service/payment_method_service.go   CREATE
  service/datastudio_service.go       CREATE
  handler/payment_method_handler.go   CREATE
  handler/datastudio_handler.go       CREATE
  dto/request/payment_method.go       CREATE
  dto/request/setting.go              MODIFY (new fields)
  dto/response/datastudio.go          CREATE
  database/migrate.go                 MODIFY (register new AutoMigrate / columns)
  database/seed.go                    MODIFY (seed default payment methods)
  router/router.go                    MODIFY (+payment-methods, +datastudio routes)
```

---

## PHASE 1 — Foundation (shell, build, auth, data)

Goal: new file tree builds and boots; real login works; sidebar/topbar/routing/role-guard match design; every route renders (placeholder views allowed until their phase).

### Task 1.1: Update Tailwind config + input.css for design tokens

**Files:**
- Modify: `frontend/tailwind.config.js`
- Modify: `frontend/styles/input.css`

- [ ] **Step 1: Verify token gap.** Design `index.html` defines `brand.400=#6366F1`, `sky2`, `ink`, `mute`, `line`, `bg2`, `ok/warn/bad`, `shadow-card`, `shadow-pop`, `rounded-xl2`. Compare to `frontend/tailwind.config.js`. The repo config already has all of these (read `docs/superpowers/design-ref/index.html` lines 13–52 vs `frontend/tailwind.config.js`). Confirm `brand.400` matches (`#6366F1`). No change needed if identical.

- [ ] **Step 2: Move design custom CSS into input.css.** The design `index.html` `<style type="text/tailwindcss">` block (design-ref/index.html lines 59–148) contains `.field`, `.dot`, scrollbar styles, and the full dark-mode override block. The repo currently inlines equivalents in `frontend/index.html` lines 17–114. Port any **missing** rules (compare both) into `frontend/styles/input.css` after the `@tailwind` directives, using plain CSS (not `@apply` unless `@tailwindcss/forms` is loaded — it is). Keep `.field` as:

```css
.field { @apply w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600; }
.dot::before { content:""; display:inline-block; width:6px; height:6px; border-radius:999px; margin-right:6px; background:currentColor; vertical-align:middle; }
```

- [ ] **Step 3: Build CSS.** Run: `cd frontend && bunx tailwindcss -c tailwind.config.js -i styles/input.css -o public/app.css --minify`
Expected: writes `public/app.css`, no error. (If `bunx tailwindcss` unavailable, check `package.json` build script — see Task 1.3.)

- [ ] **Step 4: Commit.**
```bash
git add frontend/tailwind.config.js frontend/styles/input.css
git commit -m "style: align tailwind tokens + base CSS with v2 design"
```

### Task 1.2: Merge full design icon set into icons.jsx

**Files:**
- Modify: `frontend/src/icons.jsx`

- [ ] **Step 1: Diff icon sets.** Read `docs/superpowers/design-ref/src/icons.jsx` (the `paths` object, ~50 icons) and current `frontend/src/icons.jsx`. The design set is the superset the views reference.

- [ ] **Step 2: Replace the `paths` object** in `frontend/src/icons.jsx` with the design's full `paths` object (design-ref/src/icons.jsx lines 5–66), preserving any repo-only icons not present in the design. Keep the `Icon` component signature and `window.Icon = Icon` footer identical to the design file.

- [ ] **Step 3: Sanity check.** Run: `cd frontend && node -e "require('@babel/core').transformFileSync('src/icons.jsx',{presets:[['@babel/preset-react']],babelrc:false,configFile:false})" && echo OK`
Expected: `OK` (transpiles without syntax error).

- [ ] **Step 4: Commit.**
```bash
git add frontend/src/icons.jsx
git commit -m "feat: merge full v2 design icon set"
```

### Task 1.3: Update build.mjs for new file tree + CSS step

**Files:**
- Modify: `frontend/build.mjs`
- Modify: `frontend/package.json` (build script)

- [ ] **Step 1: Replace the `FILES` array** in `frontend/build.mjs` with the new dependency order (shared before views, `app` last):

```js
const FILES = [
  'api.jsx',
  'data.jsx',
  'icons.jsx',
  'components.jsx',
  'views/dashboard.jsx',
  'views/campaigns.jsx',
  'views/campaign-editor.jsx',
  'views/analytics.jsx',
  'views/advertiser.jsx',
  'views/data-studio.jsx',
  'views/cs-inbox.jsx',
  'views/fundraiser.jsx',
  'views/shortcode.jsx',
  'views/members.jsx',
  'views/profile.jsx',
  'views/settings.jsx',
  'views/notifications.jsx',
  'views/trash.jsx',
  'views/ads-guide.jsx',
  'public/public-app.jsx',
  'login.jsx',
  'app.jsx',
];
```

- [ ] **Step 2: Add a CSS build step** to `build.mjs` (after the minify step) so one command produces both bundle and CSS:

```js
// Build Tailwind CSS → public/app.css
execFileSync('bunx', ['tailwindcss', '-c', 'tailwind.config.js', '-i', 'styles/input.css', '-o', join(outDir, 'app.css'), '--minify'], {
  stdio: 'inherit', cwd: root,
});
console.log('[build] wrote public/app.css');
```

- [ ] **Step 3: Confirm `package.json`** has `"build": "node build.mjs"` and devDeps include `@babel/core`, `@babel/preset-react`, `esbuild`, `tailwindcss`, `@tailwindcss/forms`, `@tailwindcss/typography`. Add any missing. Run `cd frontend && bun install`.

- [ ] **Step 4: Defer full build** until views exist (Phase 1 end). Commit now.
```bash
git add frontend/build.mjs frontend/package.json
git commit -m "build: new src tree FILES order + tailwind css step"
```

### Task 1.4: Extend data.jsx seeds + loaders for all views

**Files:**
- Modify: `frontend/src/data.jsx`

Current `data.jsx` already seeds campaigns, txns, fundraisers, members, daily, traffic, social-proof, trash, aggregates, and has `loadApiData/loadAdminData/loadDashboardChart/loadProfile`. Design `data.js` is a subset. The gap is seeds for views the repo loaders don't cover yet.

- [ ] **Step 1: Add missing seed exports** to `data.jsx` (place before the `window.NB` assignment), porting any data the new views read that isn't present. Cross-check each design view's top-of-file constants against `window.NB`. Likely additions: `NOTIFICATIONS` list shape used by `notifications.jsx`, analytics `funnel`/`adCosts` seeds, data-studio scorecard seeds. Add only what a view references. Keep existing exports intact.

- [ ] **Step 2: Add loaders for new endpoints** (used in later phases) as no-op-safe functions:

```js
async function loadInvoices() {
  if (typeof window.api === 'undefined') return;
  try { const r = await window.api.invoices?.('limit=100'); if (r?.data) window.TRANSACTIONS = r.data; } catch (e) { console.log('[data] invoices fallback', e?.message); }
}
async function loadAnalytics() {
  if (typeof window.api === 'undefined') return;
  try {
    const [ov, camp, utm, traf, fun] = await Promise.all([
      window.api.analyticsOverview?.(), window.api.analyticsCampaigns?.(),
      window.api.analyticsUTM?.(), window.api.analyticsTraffic?.(), window.api.analyticsFunnel?.(),
    ]);
    if (ov?.data) window.ANALYTICS_OVERVIEW = ov.data;
    if (camp?.data) window.ANALYTICS_CAMPAIGNS = camp.data;
    if (utm?.data) window.ANALYTICS_UTM = utm.data;
    if (traf?.data) window.TRAFFIC_SOURCES = traf.data;
    if (fun?.data) window.ANALYTICS_FUNNEL = fun.data;
  } catch (e) { console.log('[data] analytics fallback', e?.message); }
}
async function loadDataStudio() {
  if (typeof window.api === 'undefined') return;
  try {
    const r = await window.api.dataStudioOverview?.();
    if (r?.data) window.DATASTUDIO = r.data;
  } catch (e) { console.log('[data] datastudio fallback', e?.message); }
}
async function loadPaymentMethods() {
  if (typeof window.api === 'undefined') return;
  try { const r = await window.api.paymentMethods?.(); if (r?.data) window.PAYMENT_METHODS_LIST = r.data; } catch (e) { console.log('[data] pm fallback', e?.message); }
}
```

- [ ] **Step 3: Register** the new loaders + seeds in both the `window.NB = {...}` object and individual `window.*` exports at the bottom of `data.jsx`.

- [ ] **Step 4: Transpile check.** Run: `cd frontend && node -e "require('@babel/core').transformFileSync('src/data.jsx',{presets:[['@babel/preset-react']],babelrc:false,configFile:false}); console.log('OK')"`
Expected: `OK`.

- [ ] **Step 5: Commit.**
```bash
git add frontend/src/data.jsx
git commit -m "feat: extend seed data + API loaders for v2 views"
```

### Task 1.5: Add new API methods to api.jsx

**Files:**
- Modify: `frontend/src/api.jsx`

- [ ] **Step 1: Append new methods** inside the `api` object (before the closing `}`), matching backend routes added in Phase 3/4:

```js
  // Data Studio
  dataStudioOverview() { return this.get('/datastudio/overview'); },
  dataStudioMeta()     { return this.get('/datastudio/meta'); },
  dataStudioGoogle()   { return this.get('/datastudio/google'); },
  dataStudioTiktok()   { return this.get('/datastudio/tiktok'); },
  dataStudioFunnel()   { return this.get('/datastudio/funnel'); },
  dataStudioGeo()      { return this.get('/datastudio/geo'); },

  // Payment methods (admin)
  paymentMethods()              { return this.get('/admin/payment-methods'); },
  createPaymentMethod(data)     { return this.post('/admin/payment-methods', data); },
  updatePaymentMethod(id, data) { return this.put('/admin/payment-methods/' + id, data); },
  deletePaymentMethod(id)       { return this.del('/admin/payment-methods/' + id); },
```

- [ ] **Step 2: Transpile check** (same node -e pattern on `src/api.jsx`). Expected `OK`.

- [ ] **Step 3: Commit.**
```bash
git add frontend/src/api.jsx
git commit -m "feat: add data-studio + payment-method API methods"
```

### Task 1.6: Port components.jsx (shared kit) with repo logo path

**Files:**
- Rewrite: `frontend/src/components.jsx`

- [ ] **Step 1: Replace** `frontend/src/components.jsx` with `docs/superpowers/design-ref/src/components.jsx` verbatim. This defines `Card, StatCard, Badge, StatusBadge, RoleBadge, Progress, Btn, SearchInput, Select, DateRangePicker, DateRangePill, BarChart, LineChart, Donut, CampaignThumb, UtmGrid, Modal, InvoiceModal, Toast, PageHeader, Empty, Tabs, Toggle, SourcePill, Logo`, plus `exportCSV/exportExcel/filterByRange`, and the `AppCtx`/`useApp` context. It self-exports via `Object.assign(window, {...})`.

- [ ] **Step 2: Fix the Logo asset path.** In the ported `Logo` component, change `src="assets/logo.png"` to `src="/assets/logo-niatbaik.png"`.

- [ ] **Step 3: Guard `window.NB` destructure.** The design file's line 3 `const { fmtIDR, ... } = window.NB;` runs at file-execute time. Since `data.jsx` runs before `components.jsx` in `FILES`, `window.NB` exists. Confirm order in `build.mjs`. No code change unless order differs.

- [ ] **Step 4: Transpile check** on `src/components.jsx`. Expected `OK`.

- [ ] **Step 5: Commit.**
```bash
git add frontend/src/components.jsx
git commit -m "feat: port v2 shared component kit"
```

### Task 1.7: Port login.jsx → real backend auth

**Files:**
- Rewrite: `frontend/src/login.jsx`

The design `LoginScreen` lives inside `app.jsx` (design-ref/src/app.jsx lines 38–214) and uses a mock `ACCOUNTS` map. Extract it into `login.jsx` and wire to `/auth/login`.

- [ ] **Step 1: Create `frontend/src/login.jsx`** containing a `LoginPage({ onLogin })` component that copies the design `LoginScreen` JSX (split-screen branding + form, role pills, dark toggle, demo creds) **verbatim for markup**, with these behavior changes:
  - Logo `src="/assets/logo-niatbaik.png"`.
  - `submit` calls real auth:

```js
const submit = async (e) => {
  e && e.preventDefault();
  setError(''); setBusy(true);
  try {
    const res = await window.api.login(email.trim().toLowerCase(), password);
    if (res?.data?.user) {
      onLogin(res.data.user);
    } else {
      setError(res?.message || 'Email atau password salah.');
    }
  } catch (err) {
    setError(err?.message || 'Gagal masuk. Periksa koneksi.');
  } finally { setBusy(false); }
};
```
  - Keep the role-pill `quickLogin(roleKey)` to **prefill** the demo email/password fields (using the same `ACCOUNTS` map for convenience), but actual auth still goes through `/auth/login`. The demo accounts must exist in the DB seed (verify in `backend/internal/database/seed.go`; if missing, that's a backend seed task — note it).
  - Disable submit button while `busy`.

- [ ] **Step 2: Footer export:** `window.LoginPage = LoginPage;`

- [ ] **Step 3: Transpile check** on `src/login.jsx`. Expected `OK`.

- [ ] **Step 4: Commit.**
```bash
git add frontend/src/login.jsx
git commit -m "feat: split-screen login wired to real /auth/login"
```

### Task 1.8: Rewrite app.jsx shell (sidebar/topbar/usermenu/routing/guard)

**Files:**
- Rewrite: `frontend/src/app.jsx`

- [ ] **Step 1: Build the shell** by merging the design `app.jsx` shell (Sidebar, UserMenu, Topbar, App, AccessDenied — design-ref/src/app.jsx lines 216–588) with the repo's production concerns from the current `frontend/src/app.jsx`:
  - **Keep from repo:** `ROLE_MAP` backend→design role mapping; `authLoading` + `api.me()` token check on mount; `loadApiData()` call on mount; public routes (`landing`, `campaign-detail`) rendering `LandingPage`/`CampaignDetailWrap` from `public-app.jsx`; `ViewErrorBoundary`; `ScheduleWakeup`-free.
  - **Take from design:** the `NAV`/`SECONDARY_NAV` arrays (note design uses `inbox`/`notifications` keys — reconcile with repo's `cs-inbox`/`notification`; **use design keys** and update everything consistently), `Sidebar`, `UserMenu`, `Topbar` markup, the `Views` route map, hard role guard (`AccessDenied`), AdsGuide modal trigger (`nb-open-ads-guide`), data-studio nav event.
  - **Login:** `if (!user && !isPublicRoute) return <LoginPage onLogin={handleLogin}/>;` (LoginPage from Task 1.7, not inline).

- [ ] **Step 2: Reconcile nav keys.** Final canonical keys (used in `NAV`, `Views` map, and every view's `setView` call): `dashboard, campaigns, campaign-editor, analytics, data-studio, inbox, fundraiser, shortcode, members, profile, settings, notifications, trash`. Advertiser dashboard: design routes `analytics → AdvertiserView` when `role==='Advertiser'` (design app.jsx line 526). Keep that pattern — no separate `adv-dashboard` key.

- [ ] **Step 3: Views map** referencing the global view components (defined in their own files, available as window globals):

```js
const Views = {
  dashboard: DashboardView, campaigns: CampaignsView, 'campaign-editor': CampaignEditorView,
  analytics: role === 'Advertiser' ? AdvertiserView : AnalyticsView,
  'data-studio': DataStudioView, inbox: CSInboxView, fundraiser: FundraiserView,
  shortcode: ShortcodeView, members: MembersView, profile: ProfileView,
  settings: SettingsView, notifications: NotificationsView, trash: TrashView,
};
```

- [ ] **Step 4: Mount + ErrorBoundary.** Wrap `<Cur/>` in `ViewErrorBoundary` (port from current app.jsx). Keep `ReactDOM.createRoot(...).render(<App/>)`.

- [ ] **Step 5: Stub missing views.** Until Phases 2–5 land, add a top-of-file fallback so the bundle builds: `const __stub = () => null;` and `const DashboardView = window.DashboardView || __stub;` etc. — **No.** Instead, ensure each view file exists (create empty stub files that `window.X = () => <Placeholder/>` ) so globals resolve. Create stub `views/*.jsx` + `public/public-app.jsx` now, each exporting a placeholder, e.g.:

```js
// views/dashboard.jsx (stub — replaced in Phase 2)
function DashboardView() { return <div className="text-mute text-sm">Dashboard — coming soon</div>; }
window.DashboardView = DashboardView;
```
Create one stub per view file listed in `build.mjs`, plus `public/public-app.jsx` exporting `LandingPage`, `CampaignDetail`, `CampaignDetailModal`.

- [ ] **Step 6: Full build.** Run: `cd frontend && node build.mjs`
Expected: `[build] wrote .../app.bundle.js`, `[build] wrote .../app.min.js`, `[build] wrote public/app.css`. No babel/esbuild error.

- [ ] **Step 7: Boot smoke test.** Run: `cd frontend && (bun server.js &) ; sleep 1 ; curl -s localhost:3000 | grep -q app.min.js && echo SERVE_OK ; kill %1 2>/dev/null`
Expected: `SERVE_OK`. (Login screen renders; view stubs render after login.)

- [ ] **Step 8: Commit.**
```bash
git add frontend/src/app.jsx frontend/src/views frontend/src/public
git commit -m "feat: v2 app shell (sidebar/topbar/usermenu/routing/guard) + view stubs"
```

### Task 1.9: Remove obsolete consolidated files

**Files:**
- Delete: `frontend/src/pages-admin.jsx`, `frontend/src/pages-cs-adv.jsx`, `frontend/src/pages-misc.jsx`, `frontend/src/settings.jsx`, `frontend/src/pages-public.jsx`

- [ ] **Step 1: Confirm** none are listed in `build.mjs` `FILES` (Task 1.3 removed them). Grep for stray references: `grep -rn "pages-admin\|pages-cs-adv\|pages-misc\|pages-public" frontend/` — expect none except in old git history.

- [ ] **Step 2: Delete** the five files. Run `cd frontend && node build.mjs` again → still builds.

- [ ] **Step 3: Commit.**
```bash
git rm frontend/src/pages-admin.jsx frontend/src/pages-cs-adv.jsx frontend/src/pages-misc.jsx frontend/src/settings.jsx frontend/src/pages-public.jsx
git commit -m "refactor: drop obsolete consolidated page files"
```

**Phase 1 done when:** bundle + CSS build clean, server boots, login screen renders, post-login shell shows sidebar/topbar with correct role-filtered nav, all routes render stubs without blanking.

---

## PHASE 2 — Core admin views (dashboard, campaigns, editor)

Each task replaces a stub with the ported design view, rewired to seed+API. Pattern for all: copy design file → fix data source → keep `window.X` footer → build → commit.

### Task 2.1: Port dashboard.jsx

**Files:**
- Rewrite: `frontend/src/views/dashboard.jsx`
- Reference: `docs/superpowers/design-ref/src/views/dashboard.jsx`

- [ ] **Step 1: Copy** the design `dashboard.jsx` into `frontend/src/views/dashboard.jsx` (defines `DashboardView` + `TxnTable`, self-exports both). It renders 8 KPI cards, donation `LineChart`, payment-method `Donut`, top campaigns, traffic sources, recent-transactions table with search/status/method filters + Moota/Flip auto-confirm highlight.

- [ ] **Step 2: Rewire data sources.** Design reads `window.NB.txns`, `dailyDonations`, `trafficSources`, `campaignSeed`. Change to read live-then-seed:
  - KPIs from `window.DASHBOARD_STATS` (set by a new `loadDashboardStats()` — add it to `data.jsx` calling `api.dashboardStats()`), falling back to `window.NB` aggregates (`TOTAL_RAISED` etc).
  - Chart from `window.DAILY_DONATIONS ?? window.NB.dailyDonations`.
  - Transactions from `window.TRANSACTIONS ?? window.NB.txns`.
  - Drop the `NB_TWEAKS`/EDITMODE dependency: replace any `window.NB_TWEAKS.txnX` reads with hardcoded defaults (rowCount 8, density 'regular', showToolbar true, autoConfirmMoota true, highlightAutoConfirm true, all columns shown). Define a local `const TW = { txnRowCount:8, txnDensity:'regular', txnStriped:false, txnShowToolbar:true, txnShowDonatur:true, txnShowCampaign:true, txnShowMetode:true, txnShowSumber:true, txnShowStatus:true, txnShowTanggal:true, txnAnonymizeAll:false, txnTitle:'10 transaksi paling baru', txnAutoConfirmMoota:true, txnShowMethodFilter:true, txnHighlightAutoConfirm:true };` and reference `TW.` instead of `window.NB_TWEAKS.`.

- [ ] **Step 2b: Add `loadDashboardStats` to data.jsx** (if not added in 1.4):
```js
async function loadDashboardStats() {
  if (typeof window.api === 'undefined') return;
  try {
    const [s, pm, tr] = await Promise.all([ window.api.dashboardStats?.(), window.api.paymentMethodChart?.(), window.api.trafficSourceChart?.() ]);
    if (s?.data) window.DASHBOARD_STATS = s.data;
    if (pm?.data) window.PAYMENT_BREAKDOWN = pm.data;
    if (tr?.data) window.TRAFFIC_SOURCES = tr.data;
  } catch (e) { console.log('[data] dashboard stats fallback', e?.message); }
}
```
Register in exports. Call it from `app.jsx` mount effect (alongside `loadApiData`/`loadAdminData`).

- [ ] **Step 3: Wire invoice click.** Table invoice-code click → `useApp().setInvoiceTxn(txn)` (opens the global `InvoiceModal` mounted in `app.jsx`). Verify the design already does this; keep it.

- [ ] **Step 4: Build + boot.** `cd frontend && node build.mjs` → clean. Boot + curl as in 1.8 Step 7.

- [ ] **Step 5: Commit.**
```bash
git add frontend/src/views/dashboard.jsx frontend/src/data.jsx frontend/src/app.jsx
git commit -m "feat: port v2 dashboard view (KPIs, charts, txn table)"
```

### Task 2.2: Port campaigns.jsx (+ CampaignDetailModal)

**Files:**
- Rewrite: `frontend/src/views/campaigns.jsx`
- Reference: `docs/superpowers/design-ref/src/views/campaigns.jsx`

- [ ] **Step 1: Copy** design `campaigns.jsx` (defines `CampaignsView` + `CampaignDetailModal`, self-exports). Card/table view toggle, status filter chips, search, date filter, create button, 3-dot action menu (Edit/Add Info Update/Data Donasi/Preview/Salin URL/Delete), centered in card view.

- [ ] **Step 2: Rewire data.** Read `window.CAMPAIGNS ?? window.NB.campaignSeed`. Each campaign uses the `mapCampaign`-normalized shape (already in `data.jsx`). Status values: design uses `Running/Published/Draft/Ended`; backend uses `Berjalan` etc. Use a small normalizer: `const STATUS = { Berjalan:'Running', Selesai:'Ended' }; const norm = s => STATUS[s] || s;` for display + filtering.

- [ ] **Step 3: Wire actions.**
  - Create Campaign → `setView('campaign-editor')` with `setEditingCampaign(null)`.
  - Edit → `setEditingCampaign(c); setView('campaign-editor')`.
  - Preview → `setCampaignDetail(c)` (opens `CampaignDetailModal` mounted in app).
  - Salin URL → `navigator.clipboard.writeText(...)` + `showToast`.
  - Delete → call `api.deleteCampaign(c.id)` then refetch `loadApiData()`; on null, optimistic remove from local state + toast.

- [ ] **Step 4: Build + boot.** Clean build.

- [ ] **Step 5: Commit.**
```bash
git add frontend/src/views/campaigns.jsx
git commit -m "feat: port v2 campaigns view + detail modal"
```

### Task 2.3: Port campaign-editor.jsx

**Files:**
- Rewrite: `frontend/src/views/campaign-editor.jsx`
- Reference: `docs/superpowers/design-ref/src/views/campaign-editor.jsx`

- [ ] **Step 1: Copy** design `campaign-editor.jsx` (`CampaignEditorView`, self-exports). Left: title, image uploader 650×350, rich-text info, target, end date, location, gmaps. Right: Form Type (Donation/Zakat tabs; List/Typing/Package/Card/Package2/Qurban radios) with live preview; Publish card (category, status, Save Draft/Publish, editable Long/Short URL with pencil); Advanced Options (Payment/Form/Fundraising/WA/Pixels/GTM/Social Proof/etc collapsibles); CS Rotator (edit mode only).

- [ ] **Step 2: Rewire load/save.**
  - On mount, read `useApp().editingCampaign`. If set, prefill from it; else blank (create mode).
  - Image upload → `api.uploadImage(file)` → store returned path; on null, use local `FileReader` data URL preview.
  - Save Draft / Publish → build payload, call `api.updateCampaign(id, payload)` (edit) or `api.createCampaign(payload)` (create). On success toast + `setView('campaigns')` + `loadApiData()`. On null (offline): toast "disimpan lokal (offline)" + navigate back.
  - Payload must include the design's extra fields (`form_type`, `form_style`, `opt_nominal`, `min_donation`, advanced config) — these map to backend campaign columns added in Task 4.x (see Phase 4 backend). For now send them; backend ignores unknown until migrated.

- [ ] **Step 3: Editable URL slug** sanitization exactly as design (long: lowercase+digits+dash, min 3; short: alnum, max 16, min 4). Keep design's auto-sync-from-title-until-manual-edit logic.

- [ ] **Step 4: Build + boot.** Clean build. Manually verify create→editor→back flow renders.

- [ ] **Step 5: Commit.**
```bash
git add frontend/src/views/campaign-editor.jsx
git commit -m "feat: port v2 campaign editor (form-type, advanced opts, editable URLs)"
```

**Phase 2 done when:** dashboard shows live-or-seed KPIs/charts/table, campaigns list + detail modal + 3-dot actions work, editor opens for create/edit and saves via API with offline fallback.

---

## PHASE 3 — Ops & marketing views + Data Studio backend

### Task 3.1: Port cs-inbox.jsx

**Files:**
- Rewrite: `frontend/src/views/cs-inbox.jsx`
- Reference: `docs/superpowers/design-ref/src/views/cs-inbox.jsx`

- [ ] **Step 1: Copy** design `cs-inbox.jsx` (`CSInboxView`, `AdvFilterModal`, `ExportLimitedModal`, self-exports `CSInboxView`). Three-pane inbox, advanced filter modal (status/method/source/amount/date/attributes), limited export modal (CSV/Excel, row cap, field selector with sensitive opt-in), WA compose with number normalization + templates, update-status-to-paid, copy invoice.

- [ ] **Step 2: Rewire data.** Read `window.TRANSACTIONS ?? window.NB.txns`. On mount call `loadInvoices()` (Task 1.4). Each row uses the invoice shape — ensure `data.jsx` `loadInvoices` maps backend invoice fields to the design's expected keys (`id, donor, campaign, amount, method, status, date, utm{}, whatsapp, email, note, anon, message`). Add a mapper in `data.jsx` if backend keys differ (e.g. `invoice_code→id`, `payment_method_name→method`, `is_paid→status`).

- [ ] **Step 3: Wire writes.**
  - Update status → `api.updateInvoiceStatus(id, 'Paid')`; on success mutate local + toast; null → optimistic.
  - Add note → `api.addInvoiceNote(id, note)`.
  - WA button uses the row's `whatsapp` normalized to `https://wa.me/62...`.
  - Export uses `exportCSV`/`exportExcel` from components (global).

- [ ] **Step 4: Build + boot.** Clean build.

- [ ] **Step 5: Commit.**
```bash
git add frontend/src/views/cs-inbox.jsx frontend/src/data.jsx
git commit -m "feat: port v2 CS inbox (filters, limited export, WA, status)"
```

### Task 3.2: Port analytics.jsx

**Files:**
- Rewrite: `frontend/src/views/analytics.jsx`
- Reference: `docs/superpowers/design-ref/src/views/analytics.jsx`

- [ ] **Step 1: Copy** design `analytics.jsx` (`AnalyticsView`, self-exports). Visitor/lead/conversion funnel, ROAS, CPL/CPD, revenue per campaign, traffic-source + campaign-performance charts/tables, UTM tracking fields (6 utm_* + click IDs), platform filter (Meta/Google/TikTok/Organic).

- [ ] **Step 2: Rewire data.** On mount `loadAnalytics()` (Task 1.4). Read `window.ANALYTICS_OVERVIEW`, `ANALYTICS_CAMPAIGNS`, `ANALYTICS_UTM`, `TRAFFIC_SOURCES`, `ANALYTICS_FUNNEL`, each `?? window.NB` seed equivalent. Guard every map.

- [ ] **Step 3: Build + boot.** Clean build.

- [ ] **Step 4: Commit.**
```bash
git add frontend/src/views/analytics.jsx
git commit -m "feat: port v2 analytics view"
```

### Task 3.3: Port advertiser.jsx

**Files:**
- Rewrite: `frontend/src/views/advertiser.jsx`
- Reference: `docs/superpowers/design-ref/src/views/advertiser.jsx`

- [ ] **Step 1: Copy** design `advertiser.jsx` (`AdvertiserView`, self-exports). Per-platform cards (Meta/Google/TikTok), pixel status, manual cost-tracking input, conversion events (incl. Purchase), AI campaign recommendations, embedded landing preview.

- [ ] **Step 2: Rewire data.** Read analytics globals (same as 3.2) + `window.AD_COSTS` (add `loadAdCosts()` calling `api.adCosts()` to `data.jsx`). Cost input submit → `api.createAdCost(data)` + toast; null → optimistic local.

- [ ] **Step 3: Build + boot.** Clean build. (Recall: `analytics` route renders `AdvertiserView` when role is Advertiser — verify nav shows for Advertiser.)

- [ ] **Step 4: Commit.**
```bash
git add frontend/src/views/advertiser.jsx frontend/src/data.jsx
git commit -m "feat: port v2 advertiser dashboard"
```

### Task 3.4 (backend): Data Studio aggregation endpoints

**Files:**
- Create: `backend/internal/repository/datastudio_repo.go`
- Create: `backend/internal/service/datastudio_service.go`
- Create: `backend/internal/handler/datastudio_handler.go`
- Create: `backend/internal/dto/response/datastudio.go`
- Modify: `backend/internal/router/router.go`

- [ ] **Step 1: Define response DTOs** in `dto/response/datastudio.go` mirroring what `data-studio.jsx` renders:

```go
package response

type DSScorecard struct {
	Sessions  int64   `json:"sessions"`
	Donors    int64   `json:"donors"`
	Donations int64   `json:"donations"`
	Revenue   int64   `json:"revenue"`
	ROAS      float64 `json:"roas"`
	CVR       float64 `json:"cvr"`
}
type DSSeriesPoint struct {
	Date      string `json:"date"`
	Sessions  int64  `json:"sessions"`
	Donations int64  `json:"donations"`
	Revenue   int64  `json:"revenue"`
}
type DSSource struct {
	Source string `json:"source"`
	Sessions int64 `json:"sessions"`
	Revenue  int64 `json:"revenue"`
}
type DSOverview struct {
	Scorecard DSScorecard     `json:"scorecard"`
	Series    []DSSeriesPoint `json:"series"`
	Sources   []DSSource      `json:"sources"`
}
type DSFunnelStep struct {
	Step  string `json:"step"`
	Count int64  `json:"count"`
}
```

- [ ] **Step 2: Repo** in `datastudio_repo.go` — reuse `StatsRepo` query patterns (`stats_repo.go`). Aggregate from `invoices` (revenue=SUM(total) where is_paid; sessions/donations=COUNT; sources=GROUP BY utm_source) and `ad_costs` (spend for ROAS). Methods: `GetOverview() (*response.DSOverview, error)`, `GetFunnel() ([]response.DSFunnelStep, error)`, `GetMeta/Google/Tiktok() (...)`, `GetGeo()`. Where a dimension lacks data (geo/device), return empty slice — FE seed fills it.

```go
package repository

import (
	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"gorm.io/gorm"
)

type DataStudioRepo struct{ db *gorm.DB }
func NewDataStudioRepo(db *gorm.DB) *DataStudioRepo { return &DataStudioRepo{db: db} }

func (r *DataStudioRepo) GetOverview() (*response.DSOverview, error) {
	ov := &response.DSOverview{}
	r.db.Table("invoices").Where("is_paid = ?", true).
		Select("COALESCE(SUM(total),0)").Scan(&ov.Scorecard.Revenue)
	r.db.Table("invoices").Where("is_paid = ?", true).Count(&ov.Scorecard.Donations)
	r.db.Table("invoices").Count(&ov.Scorecard.Sessions)
	r.db.Table("invoices").Where("is_paid = ?", true).
		Distinct("email").Count(&ov.Scorecard.Donors)
	if ov.Scorecard.Sessions > 0 {
		ov.Scorecard.CVR = float64(ov.Scorecard.Donations) / float64(ov.Scorecard.Sessions) * 100
	}
	var spend int64
	r.db.Table("ad_costs").Select("COALESCE(SUM(cost),0)").Scan(&spend)
	if spend > 0 { ov.Scorecard.ROAS = float64(ov.Scorecard.Revenue) / float64(spend) }
	r.db.Table("invoices").
		Select("TO_CHAR(paid_at,'YYYY-MM-DD') as date, COUNT(*) as donations, COALESCE(SUM(total),0) as revenue").
		Where("is_paid = ? AND paid_at IS NOT NULL", true).
		Group("TO_CHAR(paid_at,'YYYY-MM-DD')").Order("date asc").Scan(&ov.Series)
	r.db.Table("invoices").
		Select("utm_source as source, COUNT(*) as sessions, COALESCE(SUM(CASE WHEN is_paid THEN total ELSE 0 END),0) as revenue").
		Where("utm_source <> ''").Group("utm_source").Order("sessions desc").Scan(&ov.Sources)
	return ov, nil
}

func (r *DataStudioRepo) GetFunnel() ([]response.DSFunnelStep, error) {
	steps := []response.DSFunnelStep{}
	var sessions, initiated, paid int64
	r.db.Table("invoices").Count(&sessions)
	r.db.Table("invoices").Where("status <> ''").Count(&initiated)
	r.db.Table("invoices").Where("is_paid = ?", true).Count(&paid)
	steps = append(steps,
		response.DSFunnelStep{Step: "Sessions", Count: sessions},
		response.DSFunnelStep{Step: "Initiated", Count: initiated},
		response.DSFunnelStep{Step: "Paid", Count: paid},
	)
	return steps, nil
}
```
(Confirm `ad_costs` has a `cost` column — check `model/ad_cost.go`; adjust column name if different. Confirm `invoices` columns `total`, `is_paid`, `paid_at`, `utm_source`, `email`, `status` exist — they do per `stats_repo.go`.)

- [ ] **Step 3: Service + handler.** `datastudio_service.go` wraps repo. `datastudio_handler.go` exposes `GetOverview`, `GetFunnel`, `GetMeta`, `GetGoogle`, `GetTiktok`, `GetGeo`, each returning `c.JSON(200, response.Success(data))` (match existing handler helper — check `dashboard_handler.go` for the success-wrapper convention).

- [ ] **Step 4: Routes** in `router.go`. Init repo/service/handler alongside others; add under the analytics group (admin+advertiser):
```go
ds := protected.Group("/datastudio")
ds.Use(middleware.RequireAdvertiser())
ds.GET("/overview", dataStudioHandler.GetOverview)
ds.GET("/funnel", dataStudioHandler.GetFunnel)
ds.GET("/meta", dataStudioHandler.GetMeta)
ds.GET("/google", dataStudioHandler.GetGoogle)
ds.GET("/tiktok", dataStudioHandler.GetTiktok)
ds.GET("/geo", dataStudioHandler.GetGeo)
```

- [ ] **Step 5: Build + vet.** `cd backend && go build ./... && go vet ./...`. Expected exit 0.

- [ ] **Step 6: Commit.**
```bash
git add backend/internal/repository/datastudio_repo.go backend/internal/service/datastudio_service.go backend/internal/handler/datastudio_handler.go backend/internal/dto/response/datastudio.go backend/internal/router/router.go
git commit -m "feat(api): data studio aggregation endpoints"
```

### Task 3.5: Port data-studio.jsx

**Files:**
- Rewrite: `frontend/src/views/data-studio.jsx`
- Reference: `docs/superpowers/design-ref/src/views/data-studio.jsx`

- [ ] **Step 1: Copy** design `data-studio.jsx` (`DataStudioView` + `DataStudioLogo/DSScorecard/DSCard/DSStackedSeries/DSHeatmap/DSIndonesiaMap`, self-exports). Looker-style: top bar, 6 page tabs (Overview/Meta/Google+GA4/TikTok/Geographic/Funnel), filter chips, scorecards, time-series, source donut, heatmap, channel table, top campaigns, geo bubbles, device/payment splits.

- [ ] **Step 2: Rewire data.** On mount `loadDataStudio()` + `api.dataStudioFunnel/Meta/...`. Read `window.DATASTUDIO ?? <seed>`. For dimensions backend returns empty (geo/device/heatmap), keep design's seed constants as fallback so the dashboard stays visually complete.

- [ ] **Step 3: Build + boot.** Clean build.

- [ ] **Step 4: Commit.**
```bash
git add frontend/src/views/data-studio.jsx frontend/src/data.jsx
git commit -m "feat: port v2 data studio view (live overview + seed-filled dims)"
```

**Phase 3 done when:** CS inbox works end-to-end with invoices API, analytics + advertiser render live-or-seed, data-studio overview/funnel pull real aggregates with seed-filled visual dimensions.

---

## PHASE 4 — Config views + backend (settings, payment CRUD, members, rest)

### Task 4.1 (backend): Extend PaymentMethod model + migration + seed

**Files:**
- Modify: `backend/internal/model/payment_method.go`
- Modify: `backend/internal/database/migrate.go`
- Modify: `backend/internal/database/seed.go`

- [ ] **Step 1: Add fields** to `model/payment_method.go`:
```go
	AccountName   string `gorm:"size:150" json:"account_name"`
	GatewayConfig string `gorm:"type:text" json:"gateway_config"` // JSON: moota/flip settings
	IsDefault     bool   `gorm:"default:false" json:"is_default"`
```

- [ ] **Step 2: AutoMigrate.** In `migrate.go`, confirm `&model.PaymentMethod{}` is in the AutoMigrate list (add if missing). GORM AutoMigrate adds new columns idempotently — safe on existing tables.

- [ ] **Step 3: Seed defaults.** In `seed.go`, seed default delete-locked methods if the table is empty:
```go
var pmCount int64
db.Model(&model.PaymentMethod{}).Count(&pmCount)
if pmCount == 0 {
	defaults := []model.PaymentMethod{
		{BankName: "QRIS", Type: "qris", Category: "qris", Code: "qris", Active: true, IsDefault: true},
		{BankName: "GoPay", Type: "ewallet", Category: "ewallet", Code: "gopay", Active: true, IsDefault: true},
		{BankName: "BCA", BankNumber: "1234567890", AccountName: "Yayasan Niat Baik", Type: "va", Category: "bank_transfer", Code: "bca", Active: true, IsDefault: true},
	}
	db.Create(&defaults)
}
```

- [ ] **Step 4: Build + vet.** `cd backend && go build ./... && go vet ./...` → exit 0.

- [ ] **Step 5: Commit.**
```bash
git add backend/internal/model/payment_method.go backend/internal/database/migrate.go backend/internal/database/seed.go
git commit -m "feat(api): extend payment_method model + seed defaults"
```

### Task 4.2 (backend): Payment method CRUD endpoints

**Files:**
- Create: `backend/internal/repository/payment_method_repo.go`
- Create: `backend/internal/service/payment_method_service.go`
- Create: `backend/internal/handler/payment_method_handler.go`
- Create: `backend/internal/dto/request/payment_method.go`
- Modify: `backend/internal/router/router.go`

- [ ] **Step 1: Request DTO** `dto/request/payment_method.go`:
```go
package request

type PaymentMethodInput struct {
	BankName      string `json:"bank_name" validate:"required"`
	AccountName   string `json:"account_name"`
	BankNumber    string `json:"bank_number"`
	Type          string `json:"type" validate:"required"`     // va/ewallet/qris/card
	Category      string `json:"category"`
	Code          string `json:"code"`
	AdminFee      int    `json:"admin_fee"`
	Active        bool   `json:"active"`
	GatewayConfig string `json:"gateway_config"`
}
```

- [ ] **Step 2: Repo** `payment_method_repo.go` with `List() ([]model.PaymentMethod, error)`, `Create(*model.PaymentMethod) error`, `Update(id, *model.PaymentMethod) error`, `Delete(id) error` (Delete must refuse `is_default=true`: return error `cannot delete default method`). Follow `category_repo.go` style.

- [ ] **Step 3: Service** `payment_method_service.go` wrapping repo + mapping DTO→model.

- [ ] **Step 4: Handler** `payment_method_handler.go`: `List/Create/Update/Delete`, validate input via existing `pkg/validator`, return success/error JSON matching existing handler convention (check `user_handler.go`).

- [ ] **Step 5: Routes** in `router.go` under `admin` group:
```go
pmRepo := repository.NewPaymentMethodRepo(db)
pmService := service.NewPaymentMethodService(pmRepo)
pmHandler := handler.NewPaymentMethodHandler(pmService)
// ...
admin.GET("/admin/payment-methods", pmHandler.List)
admin.POST("/admin/payment-methods", pmHandler.Create)
admin.PUT("/admin/payment-methods/:id", pmHandler.Update)
admin.DELETE("/admin/payment-methods/:id", pmHandler.Delete)
```
Also expose a public read for the donation form if needed (`api.GET("/payment-methods", publicHandler...)` — optional; the existing public settings may already cover it. Skip if redundant).

- [ ] **Step 6: Build + vet** → exit 0.

- [ ] **Step 7: Commit.**
```bash
git add backend/internal/repository/payment_method_repo.go backend/internal/service/payment_method_service.go backend/internal/handler/payment_method_handler.go backend/internal/dto/request/payment_method.go backend/internal/router/router.go
git commit -m "feat(api): payment method CRUD (admin)"
```

### Task 4.3 (backend): Expand Settings for ads tracking + moota/flip detail

**Files:**
- Modify: `backend/internal/model/setting.go`
- Modify: `backend/internal/dto/request/setting.go`
- Modify: `backend/internal/dto/response` (settings response, find the struct)
- Modify: `backend/internal/service/setting_service.go`
- Modify: `backend/internal/database/migrate.go` (AutoMigrate picks up new cols)

- [ ] **Step 1: Add columns** to `model/setting.go` (group with a comment):
```go
	// Ads tracking
	MetaPixelID            string `gorm:"size:100" json:"meta_pixel_id"`
	MetaCAPIEnabled        bool   `gorm:"default:false" json:"meta_capi_enabled"`
	GTMID                  string `gorm:"size:100" json:"gtm_id"`
	GoogleAdsConversionID  string `gorm:"size:100" json:"google_ads_conversion_id"`
	GA4MeasurementID       string `gorm:"size:100" json:"ga4_measurement_id"`
	TiktokPixelID          string `gorm:"size:100" json:"tiktok_pixel_id"`
	TiktokEAPIEnabled      bool   `gorm:"default:false" json:"tiktok_eapi_enabled"`
	LookerStudioEmbed      string `gorm:"type:text" json:"looker_studio_embed"`
	EventTrackingConfig    string `gorm:"type:text" json:"event_tracking_config"` // JSON
	// Moota / Flip detail
	MootaEndpoint          string `gorm:"size:255" json:"moota_endpoint"`
	MootaSignatureEnabled  bool   `gorm:"default:true" json:"moota_signature_enabled"`
	MootaDateRange         int    `gorm:"default:7" json:"moota_date_range"`
	FlipMode               string `gorm:"size:20;default:'sandbox'" json:"flip_mode"`
	FlipAutoRedirect       bool   `gorm:"default:true" json:"flip_auto_redirect"`
	FlipChargeFee          string `gorm:"size:20;default:'merchant'" json:"flip_charge_fee"`
```

- [ ] **Step 2: Extend request DTO** `dto/request/setting.go` with the same fields (json tags matching), and response struct so GET returns them. Update `setting_service.go` Update logic to persist new fields (follow the existing field-copy pattern in that file).

- [ ] **Step 3: AutoMigrate** already includes `&model.Setting{}` — new cols added idempotently.

- [ ] **Step 4: Build + vet** → exit 0.

- [ ] **Step 5: Commit.**
```bash
git add backend/internal/model/setting.go backend/internal/dto/request/setting.go backend/internal/dto/response backend/internal/service/setting_service.go
git commit -m "feat(api): expand settings (ads tracking, moota/flip detail)"
```

### Task 4.4: Port settings.jsx (8 tabs + payment editor wired to CRUD)

**Files:**
- Rewrite: `frontend/src/views/settings.jsx`
- Reference: `docs/superpowers/design-ref/src/views/settings.jsx`

- [ ] **Step 1: Copy** design `settings.jsx` (`SettingsView` + `PaymentEditorModal`, self-exports `SettingsView`). 8 tabs: Themes, Form, Payment, Tracking & Ads, Notification, Social Proof, Fundraising, General. Payment tab: list + Add Payment modal (bank, atas nama, no rek, method; Moota/Flip VA config: signature/endpoint/secret/date-range, sandbox/live mode); edit/delete per row, default locked.

- [ ] **Step 2: Rewire load.** On mount `loadPaymentMethods()` + read `window.SETTINGS` (already loaded by `loadAdminData`). Settings fields ↔ design controls (primary/secondary color, font, radius, button style; form fields config; nominal presets; min donation; anonymous/message toggles; tracking pixel IDs + toggles + event table incl Purchase; notification toggles; social proof; fundraising commission %; general site name/domain/timezone/currency/maintenance/SEO).

- [ ] **Step 3: Wire writes.**
  - Settings save (any tab) → `api.updateSettings(payload)` + toast; null → toast "tersimpan lokal".
  - Payment list reads `window.PAYMENT_METHODS_LIST ?? <seed default list>`.
  - Add/Edit payment → `api.createPaymentMethod` / `api.updatePaymentMethod` then `loadPaymentMethods()`.
  - Delete → `api.deletePaymentMethod(id)`; default rows have delete disabled (`is_default`).

- [ ] **Step 4: Build + boot.** Clean build.

- [ ] **Step 5: Commit.**
```bash
git add frontend/src/views/settings.jsx frontend/src/data.jsx
git commit -m "feat: port v2 settings (8 tabs) + payment CRUD wiring"
```

### Task 4.5: Port members.jsx

**Files:**
- Rewrite: `frontend/src/views/members.jsx`
- Reference: `docs/superpowers/design-ref/src/views/members.jsx`

- [ ] **Step 1: Copy** design `members.jsx` (`MembersView`, self-exports). User list (role, status, last login), add/edit user, permission matrix.
- [ ] **Step 2: Rewire.** Read `window.USERS ?? window.NB.members`. Add/edit → `api.createUser`/`api.updateUser`; delete → `api.deleteUser` (add to api.jsx if missing: `deleteUser(id){return this.del('/users/'+id);}`). Permission matrix is display + local state (persist optional/out-of-scope per spec).
- [ ] **Step 3: Build + boot.** Clean build.
- [ ] **Step 4: Commit.**
```bash
git add frontend/src/views/members.jsx frontend/src/api.jsx
git commit -m "feat: port v2 members view"
```

### Task 4.6: Port fundraiser, shortcode, profile

**Files:**
- Rewrite: `frontend/src/views/fundraiser.jsx`, `frontend/src/views/shortcode.jsx`, `frontend/src/views/profile.jsx`
- Reference: corresponding `docs/superpowers/design-ref/src/views/*.jsx`

- [ ] **Step 1: fundraiser.jsx** — copy design (`FundraiserView`). Read `window.FUNDRAISERS ?? window.NB.fundraisers`. Copy-referral via clipboard + toast. Build.
- [ ] **Step 2: shortcode.jsx** — copy design (`ShortcodeView`). Generate embed/form/button with live preview + copy. Pure client-side (no API). Build.
- [ ] **Step 3: profile.jsx** — copy design (`ProfileView`). Read `window.PROFILE ?? user`. Edit profile → `api.updateProfile`; password → `api.changePassword`; avatar upload → `api.uploadImage` (fallback FileReader data URL) → `updateUser({avatar})`. Build.
- [ ] **Step 4: Single build + boot** after all three. Clean build.
- [ ] **Step 5: Commit.**
```bash
git add frontend/src/views/fundraiser.jsx frontend/src/views/shortcode.jsx frontend/src/views/profile.jsx
git commit -m "feat: port v2 fundraiser, shortcode, profile views"
```

### Task 4.7: Port notifications, trash, ads-guide

**Files:**
- Rewrite: `frontend/src/views/notifications.jsx`, `frontend/src/views/trash.jsx`, `frontend/src/views/ads-guide.jsx`
- Reference: corresponding `docs/superpowers/design-ref/src/views/*.jsx`

- [ ] **Step 1: notifications.jsx** — copy design (`NotificationsView`). Read `window.NOTIFICATIONS ?? window.NB.NOTIFICATIONS`. Mark-read → `api.markNotificationRead(id)`, mark-all → `api.markAllNotificationsRead()`. Build.
- [ ] **Step 2: trash.jsx** — copy design (`TrashView`). Read `window.TRASH ?? window.NB.TRASH`. Restore → `api.restoreTrash(type,id)`; permanent delete → add `api.permanentDelete(type,id){return this.del('/trash/'+type+'/'+id);}` to api.jsx. Build.
- [ ] **Step 3: ads-guide.jsx** — copy design (`AdsGuideModal`). Static content (Meta/Google/TikTok/Organik rules). Triggered by `nb-open-ads-guide` event (wired in app.jsx Task 1.8). Build.
- [ ] **Step 4: Build + boot** after all three. Clean build.
- [ ] **Step 5: Commit.**
```bash
git add frontend/src/views/notifications.jsx frontend/src/views/trash.jsx frontend/src/views/ads-guide.jsx frontend/src/api.jsx
git commit -m "feat: port v2 notifications, trash, ads-guide"
```

**Phase 4 done when:** all 15 admin views render real content; settings persists incl payment CRUD + tracking config; backend builds with new endpoints.

---

## PHASE 5 — Public site (landing + campaign detail + donation flow)

### Task 5.1: Port public-app.jsx

**Files:**
- Rewrite: `frontend/src/public/public-app.jsx`
- Reference: `docs/superpowers/design-ref/src/public/public-app.jsx` and `docs/superpowers/design-ref/public.html`

- [ ] **Step 1: Copy** the design `public/public-app.jsx`. It defines the public landing page, campaign grid, campaign detail, and the 3-step donation flow. Refactor its exports so `app.jsx` can use them as the single-SPA public routes. Required window globals (referenced by `app.jsx` Task 1.8): `LandingPage`, `CampaignDetail` (takes `{ id, onBack }`), and `CampaignDetailModal` (already from campaigns.jsx — do not redefine; ensure no name clash, rename the public one to `PublicCampaignDetail` if needed and export as `CampaignDetail`).

- [ ] **Step 2: Reconcile architecture.** The design ships `public.html` as a separate page. The repo uses **one SPA**: `app.jsx` renders `LandingPage` for route `landing` and `CampaignDetailWrap` for `campaign-detail`. So:
  - `LandingPage` navigates to a campaign via `useApp().openCampaign(slugOrId)` (which sets `campaignDetail` + route `campaign-detail`).
  - The "Lihat situs publik" links in sidebar/login that point to `public.html` → change to `setView('landing')` (in-app navigation), since there is no separate public.html in this SPA. (If a standalone public.html is later desired, that's a separate task; out of scope here.)

- [ ] **Step 3: Rewire data.**
  - Landing campaign grid: `window.CAMPAIGNS ?? window.NB.campaignSeed` (already loaded by `loadApiData`).
  - Stats strip: `window.TOTAL_RAISED/TOTAL_DONORS/ACTIVE_CAMPAIGNS` (seed or `publicStats`).
  - Campaign detail: fetch by slug via `api.campaign(slug)`; fallback to the campaign object already in `window.CAMPAIGNS`.
  - Social-proof popup: `window.NB.socialProofLines`.

- [ ] **Step 4: Wire donation flow.** Steps nominal → identitas → pembayaran → success:
  - Payment options from `window.PAYMENT_METHODS_LIST ?? window.NB.paymentMethods`.
  - Submit → `api.createDonation({ campaign_id/slug, amount, name, whatsapp, email, anonymous, message, payment_method, utm... })`. On success show invoice + `api.paymentStatus(invoice)` polling for status; on null (offline) show a mock success state with toast "mode demo".
  - Capture UTM params from `window.location.search` into the donation payload.

- [ ] **Step 5: Build + boot.** `cd frontend && node build.mjs` clean. Boot, curl `/` → landing renders; simulate `campaign-detail` route.

- [ ] **Step 6: Commit.**
```bash
git add frontend/src/public/public-app.jsx frontend/src/app.jsx
git commit -m "feat: port v2 public site (landing + campaign detail + donation flow)"
```

### Task 5.2: Reconcile index.html head with v2 (fonts, meta, dark preloader)

**Files:**
- Modify: `frontend/index.html`

- [ ] **Step 1: Verify** the existing `frontend/index.html` (already migrated to `/app.min.js` + `/app.css`) keeps: Plus Jakarta Sans font link, theme-color meta, dark-mode preloader script, React UMD prod scripts, `<div id="root">`. The inline `<style>` dark overrides can stay OR be moved fully into `app.css` (Task 1.2). Ensure no duplicate/conflicting CSS between inline and `app.css`.

- [ ] **Step 2: Confirm title/description** reflect NiatBaik (donation platform), not "Admin Console" only — since this SPA serves the public landing at `/` too. Use the existing repo title.

- [ ] **Step 3: Build + boot** → landing + console both render.

- [ ] **Step 4: Commit (if changed).**
```bash
git add frontend/index.html
git commit -m "chore: reconcile index.html head for v2 SPA"
```

**Phase 5 done when:** `/` renders the redesigned landing, campaign cards open detail, the 3-step donation flow submits via `/donations` with offline fallback, social-proof + sticky CTA work.

---

## PHASE 6 — Verify & ship

### Task 6.1: Full frontend build verification

- [ ] **Step 1: Clean build.** Run:
```bash
cd frontend && rm -rf public/app.bundle.js public/app.min.js public/app.css && node build.mjs
```
Expected: all three artifacts written, no babel/esbuild/tailwind error.

- [ ] **Step 2: Bundle sanity.** Run: `grep -c "window.DashboardView\|window.SettingsView\|window.LoginPage\|LandingPage" frontend/public/app.bundle.js` — expect ≥4 (all major globals present).

- [ ] **Step 3: Boot + route smoke.** Run:
```bash
cd frontend && (bun server.js >/tmp/nb_fe.log 2>&1 &) ; sleep 1.5
curl -s localhost:3000/ | grep -q 'id="root"' && echo ROOT_OK
curl -s localhost:3000/app.min.js | head -c 50 | grep -q . && echo BUNDLE_OK
curl -s localhost:3000/app.css | grep -q . && echo CSS_OK
pkill -f "bun server.js" 2>/dev/null
```
Expected: `ROOT_OK`, `BUNDLE_OK`, `CSS_OK`.

- [ ] **Step 4: Commit** built artifacts only if the repo tracks them (check `.gitignore` — if `public/` is ignored, skip). Otherwise no commit.

### Task 6.2: Full backend build + test verification

- [ ] **Step 1: Build + vet.** `cd backend && go build ./... && go vet ./...` → exit 0.
- [ ] **Step 2: Tests.** `cd backend && go test ./...` → all pass (or pre-existing failures unchanged; note any).
- [ ] **Step 3: Migration dry check.** If a local Postgres + `.env` exist, run the server once (`go run ./cmd/server` with migrate-on-boot) against a scratch DB to confirm AutoMigrate applies the new columns without error, then stop. If no DB available, skip and note.
- [ ] **Step 4: No commit** unless code changed during fixes.

### Task 6.3: Docker build verification

- [ ] **Step 1: Frontend image.** `docker build -t niatbaik-fe:v2test frontend/` → success. (Confirms `frontend/Dockerfile` runs `node build.mjs` / installs deps correctly.)
- [ ] **Step 2: Backend image.** `docker build -t niatbaik-api:v2test backend/` → success.
- [ ] **Step 3:** Remove test images: `docker rmi niatbaik-fe:v2test niatbaik-api:v2test`.
- [ ] **Step 4: Fix Dockerfiles if needed** (e.g. frontend Dockerfile must copy `views/`, `public/`, `styles/`, run tailwind). Commit fixes:
```bash
git add frontend/Dockerfile backend/Dockerfile
git commit -m "fix: docker builds for v2 file tree"
```

### Task 6.4: Update CLAUDE.md / memory + push branch

- [ ] **Step 1: Update memory.** Record that frontend was re-ported to v2 structure (`src/views/` + `src/public/`), build via `node build.mjs` (Bun/esbuild/tailwind), new backend endpoints (`/datastudio/*`, `/admin/payment-methods`), expanded settings. Update `project_niatbaik-deploy-status.md` if structure changed.

- [ ] **Step 2: Final review.** `git log --oneline dev..redesign/v2-console` — confirm clean, scoped commits. `git status` clean.

- [ ] **Step 3: Push branch.**
```bash
git push -u origin redesign/v2-console
```
Expected: branch created on origin. **Do NOT merge to dev/main. Do NOT deploy to VPS.**

- [ ] **Step 4: Hand off.** Report branch URL + summary: what changed, how to build/run locally, what backend migrations will apply on first boot, and that production deploy is a manual follow-up.

**Phase 6 done when:** frontend + backend + both Docker images build clean, branch pushed to origin, no production deploy performed.

---

## Self-Review notes (coverage check)

- Spec §4.2 file structure → Phase 1 (tasks 1.3, 1.6–1.9) + per-view creates. ✓
- Spec §4.3 crash-proof data flow → Conventions + every view's "rewire data" step (seed `??` API). ✓
- Spec §4.4 role mapping → Task 1.8 Step 1 (keep repo `ROLE_MAP`). ✓
- Spec §4.5 drop tweaks panel → Task 2.1 Step 2 (hardcode `TW` defaults). ✓
- Spec §5 view/endpoint table → Phases 2–4 cover every row. ✓
- Spec §6.1 payment CRUD → Tasks 4.1, 4.2. ✓
- Spec §6.2 settings expansion → Task 4.3, consumed in 4.4. ✓
- Spec §6.3 data studio aggregation → Task 3.4, consumed in 3.5. ✓
- Spec §6.4 migrations idempotent → Tasks 4.1/4.3 use GORM AutoMigrate (additive). ✓
- Spec §7 public site → Phase 5. ✓
- Spec §8 verification/deploy → Phase 6 (build FE+BE+docker, push branch, no VPS). ✓
- Spec §9 phases → Phases 1–6 map 1:1. ✓

**Naming consistency:** nav keys finalized in Task 1.8 Step 2 (`inbox`, `notifications`, `data-studio`, `campaign-editor`); view globals match design self-exports (`DashboardView`, `CampaignsView`, `CampaignEditorView`, `AnalyticsView`, `AdvertiserView`, `DataStudioView`, `CSInboxView`, `FundraiserView`, `ShortcodeView`, `MembersView`, `ProfileView`, `SettingsView`, `NotificationsView`, `TrashView`, `AdsGuideModal`). API methods added in 1.5/4.5/4.7 match backend routes in 3.4/4.2. ✓
