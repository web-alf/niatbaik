# NiatBaik Frontend Redesign v2.6 — Design Spec

_Date: 2026-06-01 · Branch: `redesign/v2-console`_

## 1. Goal

Faithful re-port of the canonical Claude Design handoff bundle (`cf-niat-baik`,
admin console `index.html` + public `public.html`) into the live codebase,
while **preserving the working API layer, esbuild build pipeline, and Go
backend role wiring**. Backend adapted "fully" to support every view. Public
site re-designed too. All work on an isolated branch — no production deploy.

## 2. Context: what already exists

The current `frontend/` is an **earlier, consolidated port** of this same
design (same nav keys, same view names, wired to Go API + seed fallback). It is
mid-migration from CDN+`@babel/standalone` to a prebuilt esbuild bundle. Recent
commits patched port bugs ("blank-white view crashes", "broken inbox route") —
the old consolidation is fragile.

The design package (`/tmp/niatbaik-design/cf-niat-baik/project/`) is the
**canonical, newer iteration**: one file per view (~8900 LOC), mature dark
mode, Moota/Flip, Data Studio, Ads Guide, full Campaign Editor, Tweaks panel —
but **pure mock** (no `api.jsx`, no backend wiring).

**Backend (Go, `backend/`)** is live and capable:
- `internal/model/setting.go` already has Moota/Flip/theme/form/social-proof fields.
- `internal/model/payment_method.go` exists (bank, number, type, fee, active).
- `internal/repository/stats_repo.go` has full dashboard/analytics aggregation.
- Router (`internal/router/router.go`) exposes `/dashboard/*`, `/analytics/*`,
  `/admin/campaigns`, `/users`, `/invoices/*`, `/settings`, `/fundraisers`,
  `/notifications`, `/profile`, `/trash`, webhooks `/webhooks/{moota,flip}`.
- Legacy Laravel `src/` is being retired (not in scope).

## 3. Decisions (locked with user)

| Topic | Decision |
|---|---|
| Port approach | **Faithful re-port**, keep `api.jsx` + esbuild + backend role mapping |
| Backend depth | **Full** — add every endpoint the new views need |
| Public site | **Included** — re-port landing + campaign detail + 3-step donation flow |
| Branch | **`redesign/v2-console` from `dev`** (already created) |
| Deploy scope | **Push branch + verify local builds** — NO VPS production deploy |
| Login | **Real backend auth** (`/auth/login` JWT) with canonical split-screen design UI |
| Data Studio | **Full backend aggregation** (`/datastudio/*` from donations/invoices/ad_costs) |

## 4. Architecture

### 4.1 Build model (unchanged mechanism)

`build.mjs` transpiles each `src/*.jsx` via `@babel/preset-react`, wraps each in
its own IIFE (mirrors old per-`<script>` scope isolation), concatenates into
`public/app.bundle.js`, then esbuild-minifies → `public/app.min.js`.
Cross-file symbols resolve via **`window` globals at execute time** — not ES
imports. **Load order matters** and must match dependency order.

`index.html` loads React UMD (prod) + `/app.min.js`. `public.html` loads the
public bundle. `server.js` serves static + injects `__ASSET_VER__`.

### 4.2 New file structure (adopt design granularity)

Replace the fragile consolidated files with one-file-per-view, matching the
canonical design layout:

```
frontend/src/
  api.jsx            KEEP (fetch + JWT layer)
  data.jsx           KEEP+extend (seed + loadApiData fallback; add new seeds)
  icons.jsx          merge design icon set
  components.jsx     shared: Logo, KPI cards, DataTable, modals, UtmGrid,
                     DateRangePill, InvoiceModal, badges, Toast, charts
  app.jsx            shell: routing, role guard, sidebar, topbar, user menu
  login.jsx          split-screen login → real /auth/login
  views/
    dashboard.jsx       campaigns.jsx        campaign-editor.jsx
    analytics.jsx       advertiser.jsx       data-studio.jsx
    cs-inbox.jsx        fundraiser.jsx       shortcode.jsx
    members.jsx         profile.jsx          settings.jsx
    notifications.jsx   trash.jsx            ads-guide.jsx
  public/
    public-app.jsx   landing + campaign detail + 3-step donation flow
```

`build.mjs` `FILES` array updated to the new order:
`api, data, icons, components, views/* (dependency order), login, app`.
Public bundle built separately from `public/public-app.jsx` (+ shared deps).

The current consolidated files (`pages-admin.jsx`, `pages-cs-adv.jsx`,
`pages-misc.jsx`, `settings.jsx` at root, `pages-public.jsx`) are removed once
their content is migrated into the new tree.

### 4.3 Data flow per view (uniform, crash-proof)

Every view follows: **`load() → api.X() ?? seed`**. State initializes from
`window.NB` / `data.jsx` seed; an async loader overlays real API data when
available. If the API returns null (offline/unauth), the seed renders — **no
view ever blanks** (prevents the "blank-white" regression class). All API
reads tolerate `null`. Writes show a toast on success/failure.

### 4.4 Role mapping

Backend roles (`admin`/`cs`/`advertiser`/`fundraiser`/`user`) → design roles
(`Admin`/`CS`/`Advertiser`) via `ROLE_MAP` in `app.jsx` (fundraiser/user →
Admin fallback as today). Nav filtering + hard render guard (`AccessDenied`)
exactly as canonical design `app.jsx:539`.

### 4.5 Tweaks panel

Drop the `EDITMODE-BEGIN/END` artifact (a design-tool mechanism). Bake sensible
defaults directly (txnRowCount 8, regular density, auto-confirm Moota/Flip ON,
method filter on). Keep the runtime Tweaks UI optional/removed — not needed in
production. Decision: **remove tweaks-panel**, hardcode its defaults.

## 5. Views — source & backend needs

| View | Existing endpoint | New backend work |
|---|---|---|
| Dashboard | `/dashboard/*` ✓ | — |
| Campaigns | `/admin/campaigns` ✓ | campaign extra fields (form_type, advanced opts) |
| Campaign Editor | `/admin/campaigns` ✓ | persist form-type, nominal presets, advanced config |
| Analytics | `/analytics/*` ✓ | — |
| Advertiser | `/analytics/*` + `/ad-costs` ✓ | — |
| CS Inbox | `/invoices/*` ✓ | — |
| Members | `/users` ✓ | permission-matrix persist (optional) |
| Fundraiser | `/fundraisers` ✓ | — |
| Notifications / Trash / Profile | ✓ | — |
| **Settings** | `/settings` ✓ | **payment-method CRUD**, Moota/Flip config persist, **ads tracking config** |
| **Data Studio** | — | **`/datastudio/*` aggregation endpoints** |
| Ads Guide | static content | — |
| Public site | `/campaigns`, `/campaigns/:slug`, `/donations` ✓ | — |

## 6. Backend changes (Go) — "full"

All additive — no breaking changes to existing endpoints.

### 6.1 Payment methods CRUD (Admin)
- Routes: `GET/POST/PUT/DELETE /admin/payment-methods`.
- New: `payment_method_repo.go`, `payment_method_service.go`,
  `payment_method_handler.go`; DTOs in `dto/request` + `dto/response`.
- Fields: bank_name, account_name (→ add `AccountName` to model), bank_number,
  type (va/ewallet/qris/card), gateway code, admin_fee, category, active,
  gateway config (moota/flip JSON).
- Migration: add `account_name`, `gateway_config (jsonb/text)`, `is_default
  (bool)` to `payment_methods`. Seed default methods (QRIS, GoPay, etc.) as
  `is_default=true` (delete-locked in UI).

### 6.2 Settings expansion
- Reuse existing `Setting` model fields. Add columns if missing for:
  ads tracking (`meta_pixel_id`, `meta_capi_enabled`, `gtm_id`,
  `google_ads_conversion_id`, `ga4_measurement_id`, `tiktok_pixel_id`,
  `tiktok_eapi_enabled`, `looker_studio_embed`), event-tracking config (JSON),
  Moota (`moota_endpoint`, `moota_signature_enabled`, `moota_date_range`),
  Flip (`flip_mode` sandbox/live, `flip_auto_redirect`, `flip_charge_fee`).
- `setting_service` + `setting_handler` already exist → extend
  request/response DTOs and update logic. One migration:
  `2026_06_01_..._expand_settings_for_redesign`.

### 6.3 Data Studio aggregation
- New `datastudio_repo.go` (or extend `stats_repo.go`) +
  `datastudio_service.go` + `datastudio_handler.go`.
- Routes under `/datastudio` (admin + advertiser, reuse `RequireAdvertiser`):
  - `GET /datastudio/overview` — scorecards (sessions, donors, donations,
    revenue, ROAS, CVR), time-series, source breakdown, device/payment split.
  - `GET /datastudio/meta` `/datastudio/google` `/datastudio/tiktok` —
    per-platform metrics from `ad_costs` + invoices UTM.
  - `GET /datastudio/funnel` — conversion funnel steps.
  - `GET /datastudio/geo` — sessions/donations by province.
- Built on existing invoice/donation/ad_cost tables. Where a dimension has no
  real data (e.g. device, geo), return empty → FE seed fallback fills it.

### 6.4 Migrations
Follow existing pattern in `internal/database/migrate.go` + `seed.go`. Run via
existing migrate path. Keep idempotent (`AddColumn` guarded).

## 7. Public site

Re-port `public-app.jsx`:
- Hero (emotional headline, urgent campaign card, ctaPulse), trust marquee,
  live stats, campaign grid + category filter, "Cara berdonasi" 4-step,
  testimonials, FAQ accordion, footer, sticky mobile CTA.
- Campaign detail: banner, progress, recent donors, 3-step donation flow
  (nominal → identitas → pembayaran → success), social-proof popup.
- Wired to `/campaigns`, `/campaigns/:slug`, `POST /donations`,
  `GET /donations/:invoice`. Seed fallback for offline.

## 8. Verification & deploy (safe)

1. Frontend: `cd frontend && node build.mjs` (esbuild) → bundles build clean.
2. Backend: `cd backend && go build ./... && go vet ./...` clean; `go test ./...`.
3. Docker: `docker build` frontend image + backend image succeed.
4. Optional smoke: bring up via existing dev compose if time permits.
5. Commit per phase; push `redesign/v2-console` to origin.
6. **Do NOT** deploy to `donasi.niatbaik.org`. Hand off branch for manual deploy.

## 9. Phases

1. **Foundation** — file restructure, `build.mjs` FILES update, shell
   (`app.jsx` routing/guard/sidebar/topbar/user-menu), `login.jsx` real auth,
   `data.jsx` seed extension. Bundle builds.
2. **Core admin** — `components.jsx` shared kit + `dashboard`, `campaigns`,
   `campaign-editor`.
3. **Ops & marketing** — `cs-inbox`, `analytics`, `advertiser`, `data-studio`
   (+ backend `/datastudio/*`).
4. **Config & rest** — `members`, `settings` (+ backend payment CRUD, settings
   expansion, ads tracking), `fundraiser`, `shortcode`, `profile`,
   `notifications`, `trash`, `ads-guide`.
5. **Public site** — `public/public-app.jsx` + `public.html`.
6. **Verify & ship** — builds (FE+BE+docker), tests, push branch.

## 10. Risks & mitigations

- **Regression of working API wiring** → keep `api.jsx` verbatim; every view has
  seed fallback; never blank on null.
- **Build order breakage** (window-global resolution) → carefully order `FILES`;
  shared (`components`) before views; `app` last.
- **Backend migration on live data** → additive columns only, idempotent,
  defaults non-breaking; tested on local DB before push.
- **Scope creep** (Data Studio is huge) → aggregate what real tables allow;
  seed-fill missing dimensions rather than inventing schema.
- **Bundle size** → minified; lazy skeletons retained.

## 11. Out of scope

- Production VPS deploy. Legacy Laravel `src/`. New payment gateways beyond
  Moota/Flip. 2FA. Real Looker Studio OAuth embed (UI only).
