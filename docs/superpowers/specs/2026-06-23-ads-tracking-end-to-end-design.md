# Ads Tracking End-to-End + Status Aktif Real

**Date:** 2026-06-23
**Status:** Design (pending approval)
**Owner:** senior fullstack

## 1. Problem

Sistem "ads tracking" di NiatBaik hari ini **dirancang tapi mati** — pondasi lengkap, tapi kabelnya tidak disambung:

| Komponen | Ada? | Berfungsi? |
|---|---|---|
| Setting pixel (Meta/GTM/GAds/GA4/TikTok/Looker) di DB + form admin | ✅ `setting.go:99-108`, `settings.jsx:885` | ✅ tersimpan |
| Endpoint `GetPublicSettings` expose `meta_pixel_id`, `gtm_id`, dll | ✅ `public_handler.go:149-155` | ✅ |
| Field UTM di Invoice (6 field: source/medium/campaign/content/term/id) | ✅ `invoice.go:50-55` | ⚠️ **DTO hanya 3** (`donation.go:18-20`) — content/term/id tidak di-mapped |
| Capture UTM dari URL di halaman publik | ❌ | `public-app.jsx` hanya baca `?ref=` (line 746); tidak ada `utm_*` capture |
| Inject pixel script (fbq/gtag/ttq/dataLayer) ke halaman publik | ❌ | grep `fbq|gtag|ttq|dataLayer` di `public-app.jsx` hanya match CSS `tracking-tight` — **tidak ada pixel fire** |
| Meta CAPI server-side (flag `MetaCAPIEnabled` ada) | ❌ | flag disimpan; tidak ada POST ke `graph.facebook.com` |
| TikTok EAPI server-side (flag `TiktokEAPIEnabled` ada) | ❌ | flag disimpan; tidak ada POST ke `business.tiktok.com` |
| Tabel `pixel_events` (di AutoMigrate line 47) | ⚠️ orphan | tidak ada repo/handler/service yang membaca/menulis |
| "Status Pixel" di `advertiser.jsx:107-119` | ❌ | **hardcoded mock**: Meta/GTM/GA4="Active", GAds="Not Connected", TikTok="Error" |
| "Conversion Events (24jam)" di `advertiser.jsx:129-142` | ❌ | hardcoded mock numbers |
| Data Studio repo aggregate by `utm_source` | ✅ `datastudio_repo.go:46` | ⚠️ selalu kosong karena UTM tidak pernah diisi |

**Akibat:** Admin bisa isi Pixel ID di Settings, tapi tidak ada pixel yang load di halaman donor, UTM kosong, dashboard menampilkan angka palsu, dan "status aktif" adalah kebohongan. Konversi iklan tidak pernah terkirim ke Meta/Google/TikTok → optimasi iklan buta.

## 2. Goal

> **"Tracking berjalan, dan dikasih status aktif jika terhubung dengan dashboard ads."**

Tiga outcome konkret:

1. **Tracking berjalan** — pixel client-side (PageView/ViewContent/InitiateCheckout/AddPaymentInfo) + UTM tertangkap + **Purchase server-side** via Meta CAPI & TikTok EAPI saat invoice PAID.
2. **Status aktif real** — badge per-platform di dashboard merefleksikan konfigurasi + hasil event terakhir, bukan mock.
3. **Data Studio jujur** — aggregate UTM berisi data karena UTM benar-benar ditangkap.

## 3. Keputusan desain (dari klarifikasi)

- **Level tracking:** paling lengkap — pixel client-side + UTM capture + status real + **CAPI Meta + TikTok EAPI** server-side.
- **Credential management:** disimpan di DB via form admin (`Setting`, field baru; token rahasia `json:"-"`), bukan env var. Pakai sandbox/test event code di dev.
- **Timing event:** CAPI/EAPI fire **saat invoice jadi PAID** (webhook Flip/Moota konfirmasi). Idempotent via `event_id = invoice_number`.
- **Status aktif:** 4 state — Active (configured + last event success) / Configured (terisi, belum ada event sukses) / Error (terisi, last call gagal) / Not Connected (kosong).

## 4. Arsitektur & alur data

```
DONOR (browser)                         SERVER                          AD PLATFORMS
─────────────────                       ──────                          ────────────
landing/campaign ──fbq/gtag/ttq──►  (client pixel, direct)          Meta / GA4 / GAds / TikTok
  ViewContent                       scripts injected from
  InitiateCheckout                  /api/settings/public
  AddPaymentInfo
        │
        │ (utm_* dari URL disimpan sessionStorage, survive navigasi)
        ▼
   submit donasi ──────────────────►  donation_service
   (utm_* ikut payload)              map 6 UTM fields → invoice
        │
        ▼
   bayar (Flip/Moota) ─────────────►  webhook → payment_service.ProcessPayment
                                          │  (mark invoice PAID + balances, tx commit)
                                          └─ AFTER commit: tracking_service.SendConversions
                                                │  goroutine + recover (never block payment)
                                                ├─ Meta CAPI  POST graph.facebook.com/{version}/{pixel_id}/events  ──► Meta
                                                ├─ TikTok EAPI POST business.tiktok.com/open_api/v1.3/event/track/ ──► TikTok
                                                └─ write tracking_dispatch_log (platform, event, success, http, remote_event_id, error)

ADMIN DASHBOARD
  GET /api/admin/tracking/status ──► { per-platform: configured, enabled, lastEvent{at,success,error}, recentCount24h } ──► advertiser.jsx badge
```

**Prinsip kunci:**

- Event authoritative (Purchase) dikirim **server-side saat invoice PAID** → tahan ad-blocker/ATT, idempotent.
- Client-side pixel khusus funnel atas (PageView/ViewContent/InitiateCheckout/AddPaymentInfo) — non-critical, hanya untuk optimasi audience.
- **Gagal tracking tidak pernah menggagalkan konfirmasi pembayaran.** Hook dijalankan setelah transaksi commit, via goroutine + `recover`.
- `event_id` deterministik (`invoice_number`) → platform dedup replay (webhook Flip/Moota retry tidak double-count).

## 5. Komponen backend

### 5.1 Model baru/kolom baru

**`model/setting.go`** — tambah 4 kolom (pola `json:"-"` untuk secret, persis Moota/Flip di line 45-53):

```go
// Ads tracking — server-side credentials (CAPI / EAPI)
MetaCAPIToken      string `gorm:"type:text" json:"-"`            // Meta Graph API access token
MetaTestEventCode  string `gorm:"size:100" json:"meta_test_event_code"` // Meta test event code (sandbox)
TiktokAccessToken  string `gorm:"type:text" json:"-"`            // TikTok Events API access token
TiktokTestEventCode string `gorm:"size:100" json:"tiktok_test_event_code"` // TikTok test ID (sandbox)
```

> Catatan: `MetaCAPIEnabled`/`TiktokEAPIEnabled` sudah ada — dipakai sebagai gate.

**`model/tracking_dispatch_log.go`** (file baru) — sumber "last event result":

```go
type TrackingDispatchLog struct {
    ID            uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
    Platform      string    `gorm:"size:20;not null;index" json:"platform"`       // meta | tiktok
    EventName     string    `gorm:"size:50;not null" json:"event_name"`            // Purchase | Lead | ...
    InvoiceID     *uuid.UUID `gorm:"type:uuid;index" json:"invoice_id,omitempty"`  // nullable (untuk test event)
    EventID       string    `gorm:"size:100" json:"event_id"`                      // deterministik = invoice_number, utk dedup
    Success       bool      `gorm:"not null" json:"success"`
    HTTPStatus    int       `json:"http_status"`
    RemoteEventID string    `gorm:"size:200" json:"remote_event_id,omitempty"`     // id dari response platform
    ErrorMessage  string    `gorm:"type:text" json:"error_message,omitempty"`
    CreatedAt     time.Time `gorm:"index" json:"created_at"`
}
```

**Daftar di `database/migrate.go` AutoMigrate** (line 21-50, tambah `&model.TrackingDispatchLog{}`).

> Tabel `pixel_events` (line 47) yang orphan: **dibiarkan** untuk sekarang (bisa dihapus terpisah nanti). Pakai `tracking_dispatch_log` baru agar semantiknya jelas — log per-dispatch dengan success/error/http, bukan aggregate count+date yang menyesatkan. Tidak boleh ada kode baru menulis ke `pixel_events`.

### 5.2 DTO

**`dto/request/donation.go`** — lengkapi UTM yang hilang (invoice punya 6, DTO cuma 3):

```go
UTMContent  string `json:"utm_content"`
UTMTerm     string `json:"utm_term"`
UTMID       string `json:"utm_id"`
```

**`dto/request/setting.go`** — 4 field baru (pointer, pola konsisten line 85-90):

```go
MetaCAPIToken       *string `json:"meta_capi_token"`
MetaTestEventCode   *string `json:"meta_test_event_code"`
TiktokAccessToken   *string `json:"tiktok_access_token"`
TiktokTestEventCode *string `json:"tiktok_test_event_code"`
```

**`dto/response/tracking.go`** (file baru) — shape status endpoint:

```go
type TrackingPlatformStatus struct {
    Platform     string // meta | google | tiktok
    Name         string // "Meta Pixel · CAPI", ...
    Configured   bool   // ID+token terisi
    Enabled      bool   // gate flag on (capi_enabled / eapi_enabled)
    Status       string // active | configured | error | not_connected
    LastEvent    *TrackingLastEvent
    RecentCount24h int64
}
type TrackingLastEvent struct {
    At         time.Time
    Success    bool
    HTTPStatus int
    Error      string
    EventName  string
}
type TrackingStatusResponse struct {
    Platforms []TrackingPlatformStatus
}
```

### 5.3 Repository baru

**`repository/tracking_repo.go`**:

- `LogDispatch(log *model.TrackingDispatchLog) error` — insert.
- `LastPerPlatform() (map[string]model.TrackingDispatchLog, error)` — `DISTINCT ON (platform) ... ORDER BY platform, created_at DESC` (Postgres).
- `CountByEvent24h() (map[string]int64, error)` — count log sukses per platform dalam 24 jam terakhir.

### 5.4 Service baru

**`service/tracking_service.go`**:

```go
type TrackingService struct {
    repo     *repository.TrackingRepo
    settingRepo *repository.SettingRepo
    cfg      *config.Config
    http     *http.Client // timeout 5s
}

// SendConversions menembak Purchase event ke platform yang terkonfigurasi+enabled.
// Dipanggil SETELAH invoice PAID (commit). Non-blocking aman: semua error ditangkap,
// hanya menulis dispatch log. TIDAK mengembalikan error yang menggagalkan caller.
func (s *TrackingService) SendConversions(invoice *model.Invoice) {
    settings, err := s.settingRepo.Get()
    if err != nil || settings == nil { return }

    var wg sync.WaitGroup
    if settings.MetaCAPIEnabled && settings.MetaPixelID != "" && settings.MetaCAPIToken != "" {
        wg.Add(1); go func(){ defer wg.Done(); defer recoverSilent("meta"); s.sendMetaCAPI(settings, invoice) }()
    }
    if settings.TiktokEAPIEnabled && settings.TiktokPixelID != "" && settings.TiktokAccessToken != "" {
        wg.Add(1); go func(){ defer wg.Done(); defer recoverSilent("tiktok"); s.sendTiktokEAPI(settings, invoice) }()
    }
    wg.Wait()
}
```

**Meta CAPI** (`POST https://graph.facebook.com/{v18.0}/{pixel_id}/events?access_token=...`):

```json
{
  "data": [{
    "event_name": "Purchase",
    "event_time": <unix>,
    "event_id": "<invoice_number>",       // dedup
    "action_source": "website",
    "user_data": {
      "em": ["<sha256(email)>"],          // PII hashed
      "ph": ["<sha256(phone_normalized)>"]
    },
    "custom_data": { "currency": "IDR", "value": <total/100.0> }
  }],
  "test_event_code": "<optional>"
}
```

**TikTok EAPI** (`POST https://business.tiktok.com/open_api/v1.3/event/track/`, header `Access-Token`):

```json
{
  "event": "CompletePayment",
  "event_time": <unix>,
  "event_id": "<invoice_number>",
  "user": {
    "email": { "sha256": "<hash>" },
    "phone": { "sha256": "<hash>" }
  },
  "properties": { "currency": "IDR", "value": <total/100.0> },
  "test_event_code": "<optional>"
}
```

**Helper PII hashing:** `sha256Hex(strings.ToLower(strings.TrimSpace(s))))` — email lowercased+trimmed; phone dinormalisasi ke E.164 (`+62...`) sebelum hash. Sesuai spec Meta Advanced Matching & TikTok user parameter hashing.

**Helper gate:** `recoverSilent(platform string)` → `recover()` + log, supaya panic di salah satu platform tidak crash server.

### 5.5 Hook PAID

`ProcessPayment` (di `payment_service.go:40`) **tidak diubah secara langsung** — itu transaksi DB. Hook tracking dipasang **di caller setelah `ProcessPayment` sukses**, agar tracking hanya jalan saat tx sudah commit (invoice benar-benar paid):

Titik-titik caller (3):
- `flip_service.go` (webhook Flip → `ProcessPayment`)
- `moota_service.go` (webhook Moota → `ProcessPayment`)
- `donation_service.go:SimulatePayment` (sandbox)

Pattern (di tiap caller):

```go
if err := s.paymentSvc.ProcessPayment(inv); err == nil {
    invCopy := *inv // snapshot value (goroutine-safe)
    go s.trackingSvc.SendConversions(&invCopy)
}
```

> Kenapa copy: `inv` bisa di-reuse/mutate setelahnya; goroutine butuh snapshot stabil. Field yang dipakai (ID, InvoiceNumber, DonorEmail, DonorPhone, Total, CampaignID) cukup dari snapshot.

**Dependency wiring:** `TrackingService` di-inject ke `FlipService`, `MootaService`, `DonationService` via constructor + `router.go` Setup. `trackingService := service.NewTrackingService(trackingRepo, settingRepo, cfg)` dibuat setelah repo (line 31-36 area), lalu di-pass ke konstruktor flip/moota/donation yang ada di line 41-43.

### 5.6 Handler + Route baru

**`handler/tracking_handler.go`**:

```go
func (h *TrackingHandler) GetStatus(c echo.Context) error {
    // baca settings (config terisi?) + repo LastPerPlatform + CountByEvent24h
    // map ke []TrackingPlatformStatus dengan aturan status (section 7)
}
```

**`router.go`** — daftarkan:

```go
// di area admin (line 166-214)
admin.GET("/admin/tracking/status", trackingHandler.GetStatus)
```

Role gate `RequireAdmin()` sudah cukup (status expose error message sensitif admin).

## 6. Komponen frontend

### 6.1 Public: inject pixel + capture UTM

**`public/public-app.jsx`** — di hook init (saat load `/api/settings/public`):

```jsx
// (a) Inject pixel scripts dari settings (Meta/GA4/GAds/TikTok/GTM)
function initPixels(s) {
  if (s.gtm_id) { /* inject GTM script (dataLayer.push + gtm.js) */ }
  if (s.meta_pixel_id) { /* fbq init + PageView */ }
  if (s.ga4_measurement_id) { /* gtag config GA4 */ }
  if (s.google_ads_conversion_id) { /* gtag config AW- */ }
  if (s.tiktok_pixel_id) { /* ttq init + PageView */ }
}

// (b) Capture UTM dari URL → sessionStorage (survive navigasi form → invoice)
function captureUTM() {
  const p = new URLSearchParams(window.location.search);
  const utm = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','utm_id'];
  const found = {};
  utm.forEach(k => { const v = p.get(k); if (v) found[k] = v; });
  if (Object.keys(found).length) sessionStorage.setItem('nb_utm', JSON.stringify(found));
}
function getUTM() { try { return JSON.parse(sessionStorage.getItem('nb_utm') || '{}'); } catch { return {}; } }

// (c) Fire funnel events
function track(name, payload) { /* fan-out: fbq, gtag, ttq jika terkonfigurasi */ }
// ViewContent saat buka detail campaign; InitiateCheckout saat buka form donasi;
// AddPaymentInfo saat pilih metode pembayaran.

// (d) Sertakan UTM saat POST /api/donations
// (di createDonation, merge getUTM() ke body)
```

**Extract ke `lib/tracking.jsx`** (file baru) agar `public-app.jsx` tidak bengkak — helper `initPixels`, `captureUTM`, `getUTM`, `track`. Sesuai prinsip isolasi: unit kecil, satu tujuan, bisa diuji independen.

### 6.2 API client

**`api.jsx`**:

- `trackingStatus()` → `GET /api/admin/tracking/status`.
- `createDonation` sudah ada — pastikan merge UTM ke body (bagian 6.1d).

### 6.3 Advertiser dashboard — status real

**`views/advertiser.jsx`** — ganti dua blok mock:

1. **"Status Pixel"** (line 107-119): ganti array hardcoded → fetch `api.trackingStatus()`. Render per-platform dengan badge sesuai aturan status (section 7). Tampilkan `lastEvent.error` + http status untuk state Error.
2. **"Conversion Events (24jam)"** (line 129-142): ganti hardcoded → `recentCount24h` per platform dari status response (atau agregate dispatch log per event_name). Jika 0, tampilkan "—" jangan "0 palsu".

Loading state: skeleton/placeholder saat fetch. Error state: badge "Data tidak tersedia" jika endpoint gagal.

### 6.4 Settings — credential form

**`views/settings.jsx` TrackingPanel** (line 885+):

- Tambah input untuk 4 credential baru (Meta Token, Meta Test Code, TikTok Token, TikTok Test Code) — password-type input (toggle show/hide) karena rahasia.
- Sertakan di `onSave` payload (line 1019-1028): `meta_capi_token`, `meta_test_event_code`, `tiktok_access_token`, `tiktok_test_event_code`.
- Token tidak di-echo balik dari GET (backend `json:"-"`); input tampilkan placeholder "•••• (tersimpan)" jika backend kasih flag `has_meta_capi_token` — **perlu** field boolean tambahan di public/admin setting response yang menandai "ada token tersimpan tanpa membocorkan value".

  > Detail implementasi: di `GetPublicSettings`/admin setting response, expose `meta_capi_token_set bool` (bukan value). Frontend pakai itu untuk tampilkan "tersimpan". Backend: setiap kali butuh value baca dari DB.

## 7. Aturan status "aktif" (definisi presisi)

| Badge | Warna | Kondisi |
|---|---|---|
Discriminator tunggal: apakah sudah pernah ada dispatch log (`LastEvent`) atau belum.

| Badge | Warna | Kondisi |
|---|---|---|
| **Not Connected** | ⚪ abu `slate` | `Configured == false` (ID/token kosong) |
| **Configured** | 🟡 kuning `warn` | `Configured == true` **DAN** `LastEvent == nil` — belum pernah ada event dispatch sama sekali (menunggu donasi paid pertama sejak config) |
| **Error** | 🔴 merah `bad` | `Configured == true` **DAN** `LastEvent != nil` **DAN** `LastEvent.Success == false` — sudah pernah coba, last call gagal (token salah / 4xx / 5xx). Tampilkan `error_message` + http status |
| **Active** | 🟢 hijau `ok` | `Configured == true` **DAN** `LastEvent != nil` **DAN** `LastEvent.Success == true` |

Tiga state untuk platform yang configured (`LastEvent == nil` → Configured, `Success == false` → Error, `Success == true` → Active) saling eksklusif dan mencakup semua kasus. Logika di `TrackingHandler.GetStatus` (backend), bukan frontend — agar satu sumber kebenaran.

## 8. Error handling & keamanan

- **Tracking failure isolated:** goroutine + `recover()` per-platform. Payment tetap confirm walau Meta/TikTok down. Dispatch log success=false tetap tertulis (jika writeable).
- **Idempotent:** `event_id = invoice_number`; Meta & TikTok dedup replay. Webhook Flip/Moota retry tidak double-count.
- **PII hashing:** email/phone SHA-256 sebelum kirim (Meta & TikTok spec). Normalisasi phone ke E.164. Tidak kirim plain PII ke pihak ketiga.
- **Secret:** token `json:"-"`, tidak pernah dikembalikan di GET. Hanya di-save. Expose boolean `*_token_set` untuk indikasi "tersimpan".
- **HTTP timeout 5s** per platform call. Non-prod pakai test event code (Mode Test di Meta/TikTok) — event muncul di Events Manager test tool, tidak masuk production audience.
- **Role gate:** status endpoint admin-only (error message bisa sensitif). Pixel injection di public pakai public IDs saja (bukan token) — token hanya di server.
- **Non-blocking:** `SendConversions` dipanggil via goroutine di caller; caller tidak menunggu. Tapi internal `wg.Wait()` menunggu kedua platform selesai dalam goroutine itu (tidak bocor goroutine).

## 9. Testing

Pola: table-driven pure-function test di package `service` (contoh `flip_service_test.go`).

**`service/tracking_service_test.go`** (baru):

1. **PII hashing** — `sha256Hex` untuk email/phone; normalisasi phone E.164 (`0812...` → `+62812...`).
2. **event_id deterministik** — sama untuk invoice sama, beda untuk invoice beda.
3. **Gated by flag** — `MetaCAPIEnabled=false` → tidak kirim; `token=""` → tidak kirim.
4. **HTTP mock** (httptest.Server) — payload shape Meta/TikTok benar; response 200 → dispatch log success=true; response 4xx → success=false + error_message terisi.
5. **Recover** — panic di mock → tidak crash test, dispatch log tetap (atau skip gracefully).
6. **Idempotent** — `SendConversions` dipanggil 2x untuk invoice sama → 2x kirim (dedup platform-side via event_id; kita kirim ulang karena mungkin retry webhook, biar platform yang dedup).

**`service/donation_service_test.go`** (extend yang ada):

7. 6 UTM field dari request masuk invoice (source/medium/campaign/content/term/id).

**Integration (manual/sandbox):**

8. Invoice → simulate-payment (sandbox) → CAPI/EAPI mock → dispatch log + `GET /admin/tracking/status` benar (active setelah sukses, error setelah mock 4xx).
9. Public page: buka `?utm_source=meta&utm_campaign=q2` → submit donasi → invoice UTM terisi → Data Studio overview source tidak kosong.

## 10. Scope & non-goals

**In scope:**
- Pixel client-side injection (Meta/GA4/GAds/TikTok/GTM) untuk funnel atas.
- UTM capture (6 field) + wiring ke invoice.
- Meta CAPI + TikTok EAPI server-side Purchase saat PAID.
- Tabel `tracking_dispatch_log` + repo + service + handler + route.
- 4 field credential di Setting + form.
- Status aktif real di advertiser.jsx (ganti mock).
- Conversion events 24h real di advertiser.jsx.
- Test untuk hashing, event_id, gating, HTTP mock, UTM wiring.

**Non-goals (explicit):**
- Tidak menghapus tabel `pixel_events` (orphan) — biarkan, kode baru tidak menulisnya.
- Tidak integrasi Google Ads Conversion API server-side (cuma client-side AW- via gtag) — Google tidak punya CAPI seperti Meta; dedup lewat transaction_id di gtag (bisa follow-up).
- Tidak auto-refresh real-time status via long-poll (cuma fetch on-mount / manual refresh). Bisa follow-up pakai revision notifier yang sudah ada.
- Tidak mengubah schema UTM yang sudah ada di invoice.
- Tidak menambah verifikasi "pixel benar-benar firing di browser" (server tidak bisa lihat browser); status "active" = config + server event, bukan browser pixel fire. Browser pixel fire diverifikasi manual via platform Events Manager (link sudah ada di settings.jsx line 904-912).

## 11. File manifest

**Backend (new):**
- `backend/internal/model/tracking_dispatch_log.go`
- `backend/internal/repository/tracking_repo.go`
- `backend/internal/service/tracking_service.go`
- `backend/internal/service/tracking_service_test.go`
- `backend/internal/handler/tracking_handler.go`
- `backend/internal/dto/response/tracking.go`

**Backend (modified):**
- `backend/internal/model/setting.go` (+4 kolom)
- `backend/internal/database/migrate.go` (+TrackingDispatchLog)
- `backend/internal/dto/request/setting.go` (+4 field)
- `backend/internal/dto/request/donation.go` (+3 UTM field)
- `backend/internal/service/setting_service.go` (map 4 field, pola line 224-228)
- `backend/internal/service/donation_service.go` (map 3 UTM + inject trackingSvc + hook SimulatePayment)
- `backend/internal/service/flip_service.go` (hook trackingSvc.SendConversions after ProcessPayment)
- `backend/internal/service/moota_service.go` (hook trackingSvc.SendConversions after ProcessPayment)
- `backend/internal/handler/public_handler.go` (expose `meta_capi_token_set`/`tiktok_access_token_set` boolean)
- `backend/internal/handler/setting_handler.go` (expose `*_token_set` boolean di admin Get)
- `backend/internal/router/router.go` (DI trackingSvc, route `/admin/tracking/status`)

**Frontend (new):**
- `frontend/src/lib/tracking.jsx` (initPixels, captureUTM, getUTM, track)

**Frontend (modified):**
- `frontend/src/public/public-app.jsx` (init pixel + capture UTM + fire funnel + merge UTM ke donation)
- `frontend/src/api.jsx` (+trackingStatus)
- `frontend/src/views/advertiser.jsx` (status pixel real + conversion events real)
- `frontend/src/views/settings.jsx` (4 credential input + token_set indicator)

## 12. Out of scope decisions / open notes

- **API version Meta:** pakai `v18.0` (stable LTS saat desain). Bisa config-env jika perlu upgrade — untuk sekarang hardcode konstanta, dokumentasikan di komentar.
- **Google server-side:** tidak dibuat (Google tidak punya CAPI analog yang mainstream untuk Conversion API; dedup gtag `transaction_id` cukup). Jika nanti butuh Google Ads Conversion API (Google Ads API `customer/{id}/uploadClickConversions`), itu follow-up terpisah.
- **TikTok event name mapping:** Purchase server-side → TikTok event `CompletePayment` (standard event TikTok), Meta → `Purchase`. Mapping event name per-platform di helper.
- **Rate limiting ke platform:** tidak ditambah eksplisit; goroutine per-invoice cukup jarang (saat PAID). Jika volume tinggi, follow-up rate limiter per-platform.
