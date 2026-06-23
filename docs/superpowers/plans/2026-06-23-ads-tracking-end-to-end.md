# Ads Tracking End-to-End + Status Aktif Real — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make ads tracking actually run — inject client-side pixels on the public donation page, capture UTM, send server-side Purchase via Meta CAPI & TikTok EAPI when an invoice is paid, and surface a real per-platform "active" status on the Advertiser dashboard (driven by config + last dispatch result, replacing the hardcoded mock).

**Architecture:** One authoritative hook point — `PaymentService.ProcessPayment` fires `TrackingService.SendConversions` in a goroutine after the payment transaction commits (covers Flip/Moota/sandbox/manual uniformly). `TrackingService` calls Meta Graph + TikTok Events API (PII SHA-256 hashed, idempotent `event_id = invoice_number`), writes a `tracking_dispatch_log` row per attempt. A new admin endpoint aggregates config + last-log into a status payload the frontend renders. Public page injects pixel scripts from `/settings/public` and captures 6 UTM params into the invoice.

**Tech Stack:** Go (Echo, GORM, uuid, net/http), React (vanilla JSX, no router — `window.*` registration), PostgreSQL, Meta Graph API v18.0, TikTok Events API v1.3.

**Spec:** `docs/superpowers/specs/2026-06-23-ads-tracking-end-to-end-design.md`

---

## File Structure

**Backend — new files (one responsibility each):**
- `backend/internal/model/tracking_dispatch_log.go` — GORM model: one row per CAPI/EAPI dispatch attempt.
- `backend/internal/repository/tracking_repo.go` — insert log + read last-per-platform + count-24h.
- `backend/internal/service/tracking_service.go` — Meta CAPI + TikTok EAPI callers, PII hashing, dispatch logging.
- `backend/internal/service/tracking_service_test.go` — table-driven tests for hashing, event_id, gating, HTTP mock.
- `backend/internal/handler/tracking_handler.go` — `GET /admin/tracking/status` status aggregation.
- `backend/internal/dto/response/tracking.go` — status response shapes.

**Backend — modified files:**
- `backend/internal/model/setting.go` — +4 credential columns.
- `backend/internal/database/migrate.go` — +TrackingDispatchLog AutoMigrate.
- `backend/internal/dto/request/setting.go` — +4 credential request fields.
- `backend/internal/dto/request/donation.go` — +3 UTM fields (content/term/id).
- `backend/internal/service/setting_service.go` — map 4 credential fields.
- `backend/internal/service/donation_service.go` — map 3 UTM fields to invoice.
- `backend/internal/service/payment_service.go` — +optional trackingSvc, fire SendConversions after commit.
- `backend/internal/handler/setting_handler.go` — expose `*_token_set` booleans in admin Get.
- `backend/internal/handler/public_handler.go` — expose `*_token_set` booleans in public GetPublicSettings (status display only).
- `backend/internal/router/router.go` — DI TrackingService into PaymentService; register route.

**Frontend — new file:**
- `frontend/src/lib/tracking.jsx` — `initPixels`, `captureUTM`, `getUTM`, `track` helpers.

**Frontend — modified files:**
- `frontend/src/public/public-app.jsx` — init pixel, capture UTM, fire funnel events, merge UTM into donation POST.
- `frontend/src/api.jsx` — +`trackingStatus()`.
- `frontend/src/views/advertiser.jsx` — status pixel + conversion events from real data.
- `frontend/src/views/settings.jsx` — 4 credential inputs + token_set indicators.

---

## Task 1: TrackingDispatchLog model + migration

**Files:**
- Create: `backend/internal/model/tracking_dispatch_log.go`
- Modify: `backend/internal/database/migrate.go:47` (add to AutoMigrate list)

- [ ] **Step 1: Create the model file**

Create `backend/internal/model/tracking_dispatch_log.go`:

```go
package model

import (
	"time"

	"github.com/google/uuid"
)

// TrackingDispatchLog records one server-side conversion dispatch attempt to an ad
// platform (Meta CAPI or TikTok EAPI). It is the source of truth for the "last event
// result" shown on the Advertiser dashboard's pixel-status panel: success/HTTP/error
// per platform, replacing the hardcoded mock badges.
type TrackingDispatchLog struct {
	ID            uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Platform      string     `gorm:"size:20;not null;index" json:"platform"`          // "meta" | "tiktok"
	EventName     string     `gorm:"size:50;not null" json:"event_name"`              // "Purchase" (Meta) / "CompletePayment" (TikTok)
	InvoiceID     *uuid.UUID `gorm:"type:uuid;index" json:"invoice_id,omitempty"`     // nullable for test events
	EventID       string     `gorm:"size:100" json:"event_id"`                        // deterministic = invoice_number, platform dedup
	Success       bool       `gorm:"not null" json:"success"`
	HTTPStatus    int        `json:"http_status"`
	RemoteEventID string     `gorm:"size:200" json:"remote_event_id,omitempty"`       // id returned by the platform
	ErrorMessage  string     `gorm:"type:text" json:"error_message,omitempty"`
	CreatedAt     time.Time  `gorm:"index" json:"created_at"`
}
```

- [ ] **Step 2: Register in AutoMigrate**

In `backend/internal/database/migrate.go`, find the AutoMigrate list (line ~47 has `&model.PixelEvent{}`). Add `&model.TrackingDispatchLog{}` immediately after `&model.PixelEvent{}`:

```go
		&model.PixelEvent{},
		&model.TrackingDispatchLog{},
```

- [ ] **Step 3: Verify it compiles**

Run: `cd backend && go build ./...`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/internal/model/tracking_dispatch_log.go backend/internal/database/migrate.go
git commit -m "feat(tracking): add TrackingDispatchLog model + migration"
```

---

## Task 2: Setting credential columns (Meta CAPI + TikTok EAPI tokens)

**Files:**
- Modify: `backend/internal/model/setting.go:99-108` (Ads tracking block)
- Modify: `backend/internal/dto/request/setting.go:85-90`
- Modify: `backend/internal/service/setting_service.go:224-229`

- [ ] **Step 1: Add 4 columns to Setting model**

In `backend/internal/model/setting.go`, find the "Ads tracking & pixels" block (around line 99-108). After the existing `TiktokEAPIEnabled` line, add:

```go
	// Server-side conversion credentials (CAPI / EAPI). Tokens are TEXT + json:"-"
	// (never echoed on GET) — same secret pattern as Moota/Flip gateway keys above.
	MetaCAPIToken       string `gorm:"type:text" json:"-"`
	MetaTestEventCode   string `gorm:"size:100" json:"meta_test_event_code"`
	TiktokAccessToken   string `gorm:"type:text" json:"-"`
	TiktokTestEventCode string `gorm:"size:100" json:"tiktok_test_event_code"`
```

- [ ] **Step 2: Add 4 request fields to UpdateSettingRequest**

In `backend/internal/dto/request/setting.go`, find the `MetaCAPIEnabled` / `TiktokEAPIEnabled` fields (around line 85-90). Add after them:

```go
	MetaCAPIToken       *string `json:"meta_capi_token"`
	MetaTestEventCode   *string `json:"meta_test_event_code"`
	TiktokAccessToken   *string `json:"tiktok_access_token"`
	TiktokTestEventCode *string `json:"tiktok_test_event_code"`
```

- [ ] **Step 3: Map the 4 fields in setting_service.Update**

In `backend/internal/service/setting_service.go`, find the existing mapping block (the `if req.MetaCAPIEnabled != nil` ... `if req.TiktokEAPIEnabled != nil` at lines 224-229). Add immediately after the `TiktokEAPIEnabled` block:

```go
	if req.MetaCAPIToken != nil {
		setting.MetaCAPIToken = *req.MetaCAPIToken
	}
	if req.MetaTestEventCode != nil {
		setting.MetaTestEventCode = *req.MetaTestEventCode
	}
	if req.TiktokAccessToken != nil {
		setting.TiktokAccessToken = *req.TiktokAccessToken
	}
	if req.TiktokTestEventCode != nil {
		setting.TiktokTestEventCode = *req.TiktokTestEventCode
	}
```

- [ ] **Step 4: Verify it compiles**

Run: `cd backend && go build ./...`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add backend/internal/model/setting.go backend/internal/dto/request/setting.go backend/internal/service/setting_service.go
git commit -m "feat(tracking): add Meta CAPI + TikTok EAPI credential columns"
```

---

## Task 3: Expose `*_token_set` booleans (admin + public)

Token values are `json:"-"` so they never leave the DB. The dashboard needs to know "is a token saved?" without seeing it — a boolean per token.

**Files:**
- Modify: `backend/internal/handler/setting_handler.go:23-43` (admin Get)
- Modify: `backend/internal/handler/public_handler.go:123-177` (GetPublicSettings)

- [ ] **Step 1: Add booleans to admin Get response**

In `backend/internal/handler/setting_handler.go`, the `Get` method wraps `model.Setting` in a `SettingWithGateway` struct (line 30-43). Extend that struct and the assignment:

Replace the existing `SettingWithGateway` struct + resp assignment (lines 30-43) with:

```go
	// Include gateway status (keys are json:"-" so we add status manually)
	type SettingWithGateway struct {
		*model.Setting
		MootaConfigured      bool `json:"moota_configured"`
		FlipConfigured       bool `json:"flip_configured"`
		MetaCAPITokenSet     bool `json:"meta_capi_token_set"`
		TiktokAccessTokenSet bool `json:"tiktok_access_token_set"`
	}

	resp := SettingWithGateway{
		Setting:              setting,
		MootaConfigured:      setting.MootaAPIKey != "",
		FlipConfigured:       setting.FlipSecretKey != "",
		MetaCAPITokenSet:     setting.MetaCAPIToken != "",
		TiktokAccessTokenSet: setting.TiktokAccessToken != "",
	}
```

- [ ] **Step 2: Add booleans to public settings response**

In `backend/internal/handler/public_handler.go`, inside `GetPublicSettings` (the `publicSettings` map, around line 129-175), add these two lines to the "Tracking" section (after `"event_tracking_config": settings.EventTrackingConfig,`):

```go
			"meta_capi_token_set":     settings.MetaCAPIToken != "",
			"tiktok_access_token_set": settings.TiktokAccessToken != "",
```

- [ ] **Step 3: Verify it compiles**

Run: `cd backend && go build ./...`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/internal/handler/setting_handler.go backend/internal/handler/public_handler.go
git commit -m "feat(tracking): expose token_set booleans without leaking secrets"
```

---

## Task 4: Donation DTO — complete the 6 UTM fields

The invoice model has 6 UTM fields (`UTMSource/Medium/Campaign/Content/Term/ID`) but the DTO + donation_service only wires 3. Complete the missing 3.

**Files:**
- Modify: `backend/internal/dto/request/donation.go:18-20`
- Modify: `backend/internal/service/donation_service.go:170-173`

- [ ] **Step 1: Add 3 fields to CreateDonationRequest**

In `backend/internal/dto/request/donation.go`, find the UTM fields (lines 18-20). Add after `UTMCampaign`:

```go
	UTMContent  string `json:"utm_content"`
	UTMTerm     string `json:"utm_term"`
	UTMID       string `json:"utm_id"`
```

- [ ] **Step 2: Map the 3 fields in donation_service**

In `backend/internal/service/donation_service.go`, find the invoice construction (lines 154-173). The struct already sets `UTMSource`, `UTMMedium`, `UTMCampaign`. Add the three missing lines right after `UTMCampaign: req.UTMCampaign,`:

```go
				UTMContent:        req.UTMContent,
				UTMTerm:           req.UTMTerm,
				UTMID:             req.UTMID,
```

- [ ] **Step 3: Verify it compiles**

Run: `cd backend && go build ./...`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/internal/dto/request/donation.go backend/internal/service/donation_service.go
git commit -m "feat(donation): wire all 6 UTM fields into the invoice"
```

---

## Task 5: TrackingRepository — write log + read status

**Files:**
- Create: `backend/internal/repository/tracking_repo.go`

- [ ] **Step 1: Create the repository**

Create `backend/internal/repository/tracking_repo.go`:

```go
package repository

import (
	"time"

	"github.com/anrdart/niatbaik-api/internal/model"
	"gorm.io/gorm"
)

type TrackingRepo struct {
	db *gorm.DB
}

func NewTrackingRepo(db *gorm.DB) *TrackingRepo {
	return &TrackingRepo{db: db}
}

// LogDispatch persists one dispatch attempt. Errors are swallowed (only logged) so a
// logging DB hiccup never affects payment flow.
func (r *TrackingRepo) LogDispatch(log *model.TrackingDispatchLog) {
	if log == nil {
		return
	}
	if err := r.db.Create(log).Error; err != nil {
		// best-effort; do not propagate — tracking must never break payment confirmation
		_ = err
	}
}

// LastPerPlatform returns the most recent dispatch log per platform
// ("meta", "tiktok"). Uses DISTINCT ON, a Postgres feature.
func (r *TrackingRepo) LastPerPlatform() (map[string]model.TrackingDispatchLog, error) {
	var rows []model.TrackingDispatchLog
	err := r.db.Raw(`
		SELECT DISTINCT ON (platform) *
		FROM tracking_dispatch_logs
		ORDER BY platform, created_at DESC
	`).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	out := make(map[string]model.TrackingDispatchLog, len(rows))
	for _, row := range rows {
		out[row.Platform] = row
	}
	return out, nil
}

// CountByPlatform24h returns the count of SUCCESSFUL dispatches per platform in the
// last 24 hours — feeds the "Conversion Events (24h)" panel.
func (r *TrackingRepo) CountByPlatform24h() (map[string]int64, error) {
	type row struct {
		Platform string
		Count    int64
	}
	var rows []row
	err := r.db.Table("tracking_dispatch_logs").
		Select("platform, COUNT(*)").
		Where("success = ? AND created_at >= ?", true, time.Now().Add(-24*time.Hour)).
		Group("platform").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	out := make(map[string]int64, len(rows))
	for _, r := range rows {
		out[r.Platform] = r.Count
	}
	return out, nil
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd backend && go build ./...`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add backend/internal/repository/tracking_repo.go
git commit -m "feat(tracking): TrackingRepo — dispatch log write + status reads"
```

---

## Task 6: PII hashing + event_id helpers (TDD)

This is the pure-function core that must be correct (PII privacy + dedup). Test first.

**Files:**
- Create: `backend/internal/service/tracking_service.go` (helpers only first)
- Create: `backend/internal/service/tracking_service_test.go`

- [ ] **Step 1: Write failing tests**

Create `backend/internal/service/tracking_service_test.go`:

```go
package service

import (
	"crypto/sha256"
	"encoding/hex"
	"strings"
	"testing"
)

func TestSha256Hex(t *testing.T) {
	cases := map[string]string{
		// RFC 4351 example vector: sha256("abc")
		"abc": "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
		"":    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
	}
	for in, want := range cases {
		if got := sha256Hex(in); got != want {
			t.Errorf("sha256Hex(%q) = %q, want %q", in, got, want)
		}
	}
}

// sha256Hex must lowercase + trim before hashing, matching Meta/TikTok advanced matching.
func TestSha256Hex_NormalizesInput(t *testing.T) {
	raw := "  Donor@Example.COM  "
	want := sha256Hex(strings.ToLower(strings.TrimSpace(raw)))
	if got := sha256Hex(raw); got != want {
		t.Errorf("sha256Hex did not normalize: got %q, want %q", got, want)
	}
}

// normalizePhoneE164 converts Indonesian local numbers to +62 form (Meta/TikTok expect E.164).
func TestNormalizePhoneE164(t *testing.T) {
	cases := map[string]string{
		"081234567890":  "+6281234567890",
		"6281234567890": "+6281234567890",
		"+6281234567890": "+6281234567890",
		" 0812 3456 7890 ": "+6281234567890", // spaces stripped
		"0215551234":    "+62215551234",
		"":              "", // empty stays empty (donor with no phone)
	}
	for in, want := range cases {
		if got := normalizePhoneE164(in); got != want {
			t.Errorf("normalizePhoneE164(%q) = %q, want %q", in, got, want)
		}
	}
}

// dedupEventID must be deterministic per invoice number so the platform can dedup
// webhook retries.
func TestDedupEventID(t *testing.T) {
	if got := dedupEventID("INV-ABCD1234"); got != "INV-ABCD1234" {
		t.Errorf("dedupEventID = %q, want INV-ABCD1234", got)
	}
	if dedupEventID("INV-A") == dedupEventID("INV-B") {
		t.Error("dedupEventID must differ for different invoices")
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && go test ./internal/service/ -run 'TestSha256Hex|TestNormalizePhoneE164|TestDedupEventID' -v`
Expected: FAIL — `undefined: sha256Hex` / `undefined: normalizePhoneE164` / `undefined: dedupEventID`.

- [ ] **Step 3: Write the helpers**

Create `backend/internal/service/tracking_service.go`:

```go
package service

import (
	"crypto/sha256"
	"encoding/hex"
	"strings"

	"github.com/anrdart/niatbaik-api/internal/config"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
)

// TrackingService sends server-side conversion events (Purchase) to ad platforms when
// an invoice is paid, and records each attempt to tracking_dispatch_logs. It is the
// source of truth for the dashboard's per-platform "active/error" pixel status.
type TrackingService struct {
	repo        *repository.TrackingRepo
	settingRepo *repository.SettingRepo
	cfg         *config.Config
}

func NewTrackingService(repo *repository.TrackingRepo, settingRepo *repository.SettingRepo, cfg *config.Config) *TrackingService {
	return &TrackingService{repo: repo, settingRepo: settingRepo, cfg: cfg}
}

// sha256Hex returns the lowercase hex SHA-256 of the normalized (lowercased+trimmed)
// input. Used for Meta/TikTok advanced matching PII hashing.
func sha256Hex(s string) string {
	normalized := strings.ToLower(strings.TrimSpace(s))
	sum := sha256.Sum256([]byte(normalized))
	return hex.EncodeToString(sum[:])
}

// normalizePhoneE164 converts an Indonesian local phone to E.164 (+62...) form as
// expected by Meta/TikTok user_data. Empty input → empty output (donor with no phone).
func normalizePhoneE164(phone string) string {
	p := strings.TrimSpace(phone)
	// strip internal whitespace/dashes
	p = strings.NewReplacer(" ", "", "-", "").Replace(p)
	if p == "" {
		return ""
	}
	if strings.HasPrefix(p, "+") {
		return p
	}
	if strings.HasPrefix(p, "62") {
		return "+" + p
	}
	if strings.HasPrefix(p, "0") {
		return "+62" + p[1:]
	}
	return "+" + p
}

// dedupEventID returns a deterministic per-invoice event id so a platform can dedup
// retries (webhook replays, manual re-confirm). The invoice number is already unique.
func dedupEventID(invoiceNumber string) string {
	return invoiceNumber
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && go test ./internal/service/ -run 'TestSha256Hex|TestNormalizePhoneE164|TestDedupEventID' -v`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/internal/service/tracking_service.go backend/internal/service/tracking_service_test.go
git commit -m "feat(tracking): PII hashing + deterministic event_id helpers (TDD)"
```

---

## Task 7: Meta CAPI + TikTok EAPI dispatch (TDD with HTTP mock)

**Files:**
- Modify: `backend/internal/service/tracking_service.go` (add dispatch methods)
- Modify: `backend/internal/service/tracking_service_test.go` (add HTTP mock tests)

- [ ] **Step 1: Write failing tests for gating + HTTP dispatch**

Append to `backend/internal/service/tracking_service_test.go`:

```go
import (
	// add to existing import block:
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	// existing crypto/sha256, strings, testing stay
)

// makeMetaServer returns a test server that records the request body and responds
// with the given status. Returns (server, receivedBody).
func makeMetaServer(t *testing.T, status int) (*httptest.Server, *string, *sync.Mutex) {
	var mu sync.Mutex
	body := ""
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		buf := make([]byte, 0)
		tmp := make([]byte, 4096)
		for {
			n, err := r.Body.Read(tmp)
			if n > 0 {
				buf = append(buf, tmp[:n]...)
			}
			if err != nil {
				break
			}
		}
		mu.Lock()
		body = string(buf)
		mu.Unlock()
		w.WriteHeader(status)
		w.Write([]byte(`{"events_received":[{"id":"evt_123"}]}`))
	}))
	t.Cleanup(srv.Close)
	return srv, &body, &mu
}

// sendMetaCAPI must be skipped when CAPI disabled OR no token configured.
func TestSendMetaCAPI_GatedOff(t *testing.T) {
	svc := &TrackingService{}
	s := &model.Setting{MetaCAPIEnabled: false, MetaPixelID: "123", MetaCAPIToken: "tok"}
	// no panic, no dispatch
	svc.sendMetaCAPI(s, &model.Invoice{InvoiceNumber: "INV-1"})
	// enabled but no token → also skip
	s.MetaCAPIEnabled = true
	s.MetaCAPIToken = ""
	svc.sendMetaCAPI(s, &model.Invoice{InvoiceNumber: "INV-1"})
}

// sendMetaCAPI on HTTP 200 writes a success dispatch log entry.
func TestSendMetaCAPI_Success(t *testing.T) {
	srv, bodyPtr, mu := makeMetaServer(t, http.StatusOK)
	defer func() { metaCAPIURL = originalMetaCAPIURL }()
	originalMetaCAPIURL = metaCAPIURL
	metaCAPIURL = srv.URL

	repo := newMockTrackingRepo()
	svc := &TrackingService{repo: repo}
	s := &model.Setting{
		MetaCAPIEnabled: true, MetaPixelID: "PIXEL123", MetaCAPIToken: "tok",
	}
	inv := &model.Invoice{
		InvoiceNumber: "INV-XYZ", DonorEmail: "donor@example.com",
		DonorPhone: "081234567890", Total: 100000,
	}
	svc.sendMetaCAPI(s, inv)

	if len(repo.created) != 1 {
		t.Fatalf("expected 1 dispatch log, got %d", len(repo.created))
	}
	lg := repo.created[0]
	if !lg.Success || lg.HTTPStatus != http.StatusOK || lg.Platform != "meta" {
		t.Errorf("unexpected log: %+v", lg)
	}
	if lg.EventID != "INV-XYZ" {
		t.Errorf("event_id = %q, want INV-XYZ", lg.EventID)
	}
	// body must contain hashed email + hashed normalized phone, NOT plaintext
	mu.Lock()
	b := *bodyPtr
	mu.Unlock()
	if strings.Contains(b, "donor@example.com") {
		t.Error("plaintext email leaked into request body")
	}
	if strings.Contains(b, "081234567890") {
		t.Error("plaintext phone leaked into request body")
	}
	if !strings.Contains(b, sha256Hex("donor@example.com")) {
		t.Error("hashed email missing from request body")
	}
	var parsed map[string]interface{}
	if err := json.Unmarshal([]byte(b), &parsed); err != nil {
		t.Fatalf("body not valid JSON: %v", err)
	}
	if data, ok := parsed["data"].([]interface{}); !ok || len(data) != 1 {
		t.Errorf("expected data array of 1, got %v", parsed["data"])
	}
}

// sendMetaCAPI on HTTP 4xx writes a failure dispatch log with the error message.
func TestSendMetaCAPI_HTTPError(t *testing.T) {
	srv, _, _ := makeMetaServer(t, http.StatusBadRequest)
	defer func() { metaCAPIURL = originalMetaCAPIURL }()
	originalMetaCAPIURL = metaCAPIURL
	metaCAPIURL = srv.URL

	repo := newMockTrackingRepo()
	svc := &TrackingService{repo: repo}
	s := &model.Setting{MetaCAPIEnabled: true, MetaPixelID: "PIXEL123", MetaCAPIToken: "tok"}
	svc.sendMetaCAPI(s, &model.Invoice{InvoiceNumber: "INV-ERR", Total: 1000})

	if len(repo.created) != 1 || repo.created[0].Success {
		t.Fatalf("expected 1 failed log, got %+v", repo.created)
	}
	if repo.created[0].HTTPStatus != http.StatusBadRequest {
		t.Errorf("http status = %d, want 400", repo.created[0].HTTPStatus)
	}
}
```

Add the mock repo + package-level URL variables at the end of the test file (before the closing):

```go
// --- test doubles ---

// metaCAPIURL is overridable in tests; defaults to the real Meta Graph endpoint.
var metaCAPIURL = "https://graph.facebook.com/v18.0"
var originalMetaCAPIURL = "https://graph.facebook.com/v18.0"

type mockTrackingRepo struct {
	created []*model.TrackingDispatchLog
}

func newMockTrackingRepo() *mockTrackingRepo {
	return &mockTrackingRepo{}
}

func (m *mockTrackingRepo) LogDispatch(l *model.TrackingDispatchLog) {
	m.created = append(m.created, l)
}
```

> Note: `mockTrackingRepo` has a different type than `*repository.TrackingRepo`. To keep tests decoupled from the DB, `sendMetaCAPI` will take a tiny interface. We define that in step 3.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && go test ./internal/service/ -run 'TestSendMetaCAPI' -v`
Expected: FAIL — `undefined: sendMetaCAPI`, compile errors.

- [ ] **Step 3: Implement the dispatch interface + Meta CAPI caller**

At the top of `backend/internal/service/tracking_service.go`, add a small logger interface so tests can inject a fake (decoupling from the concrete repo type). Replace the `TrackingService` struct field `repo *repository.TrackingRepo` with the interface — but keep the real repo satisfying it. Update the file's struct + constructor:

```go
// dispatchLogger is the subset of TrackingRepo the dispatch methods need. Defined as
// an interface so unit tests inject a fake without a DB.
type dispatchLogger interface {
	LogDispatch(log *model.TrackingDispatchLog)
}

type TrackingService struct {
	repo        dispatchLogger
	settingRepo *repository.SettingRepo
	cfg         *config.Config
}

func NewTrackingService(repo *repository.TrackingRepo, settingRepo *repository.SettingRepo, cfg *config.Config) *TrackingService {
	return &TrackingService{repo: repo, settingRepo: settingRepo, cfg: cfg}
}
```

Then add the imports and the Meta CAPI method. Add `"bytes"`, `"encoding/json"`, `"fmt"`, `"io"`, `"log"`, `"net/http"`, `"time"` to the import block, then append to the file:

```go
// sendMetaCAPI posts a Purchase event to the Meta Conversions API for the given paid
// invoice. No-op unless CAPI is enabled and both pixel id + access token are set.
// PII (email/phone) is SHA-256 hashed. The event_id is the invoice number so Meta
// dedups retries. Errors are caught and logged as a failed dispatch — never returned.
func (s *TrackingService) sendMetaCAPI(settings *model.Setting, inv *model.Invoice) {
	if settings == nil || !settings.MetaCAPIEnabled || settings.MetaPixelID == "" || settings.MetaCAPIToken == "" {
		return
	}
	if s.repo == nil {
		return
	}

	userData := map[string]interface{}{}
	if inv.DonorEmail != "" {
		userData["em"] = []string{sha256Hex(inv.DonorEmail)}
	}
	if phone := normalizePhoneE164(inv.DonorPhone); phone != "" {
		userData["ph"] = []string{sha256Hex(phone)}
	}

	payload := map[string]interface{}{
		"data": []map[string]interface{}{{
			"event_name":    "Purchase",
			"event_time":    time.Now().Unix(),
			"event_id":      dedupEventID(inv.InvoiceNumber),
			"action_source": "website",
			"user_data":     userData,
			"custom_data": map[string]interface{}{
				"currency": "IDR",
				"value":    float64(inv.Total) / 100.0,
			},
		}},
	}
	if settings.MetaTestEventCode != "" {
		payload["test_event_code"] = settings.MetaTestEventCode
	}

	body, _ := json.Marshal(payload)
	url := fmt.Sprintf("%s/%s/events?access_token=%s", metaCAPIURL, settings.MetaPixelID, settings.MetaCAPIToken)

	dispatchLog := &model.TrackingDispatchLog{
		Platform:  "meta",
		EventName: "Purchase",
		EventID:   dedupEventID(inv.InvoiceNumber),
		InvoiceID: &inv.ID,
	}
	if id, err := uuid.Parse(inv.InvoiceNumber); err == nil {
		_ = id // invoice_number is not a uuid; keep nil
	}

	s.httpPost(url, body, dispatchLog)
}

// httpPost is the shared HTTP executor for both platforms. It performs the request,
// records success/http_status/remote_event_id/error into dispatchLog, and persists it.
func (s *TrackingService) httpPost(url string, body []byte, lg *model.TrackingDispatchLog) {
	client := &http.Client{Timeout: 5 * time.Second}
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		lg.Success, lg.ErrorMessage = false, "build request: "+err.Error()
		s.repo.LogDispatch(lg)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		lg.Success, lg.ErrorMessage = false, "http: "+err.Error()
		s.repo.LogDispatch(lg)
		return
	}
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	lg.HTTPStatus = resp.StatusCode
	// Meta/TikTok return 200 on success; anything else is a failure.
	lg.Success = resp.StatusCode >= 200 && resp.StatusCode < 300
	if !lg.Success {
		lg.ErrorMessage = string(respBody)
	} else {
		lg.RemoteEventID = extractRemoteEventID(respBody)
	}
	s.repo.LogDispatch(lg)
}

// extractRemoteEventID pulls the platform event id out of a success response body
// (best-effort; both Meta and TikTok use different shapes).
func extractRemoteEventID(body []byte) string {
	var m map[string]interface{}
	if err := json.Unmarshal(body, &m); err != nil {
		return ""
	}
	// Meta: events_received[0].id ; TikTok: event_id at top level
	if arr, ok := m["events_received"].([]interface{}); ok && len(arr) > 0 {
		if first, ok := arr[0].(map[string]interface{}); ok {
			if id, ok := first["id"].(string); ok {
				return id
			}
		}
	}
	if id, ok := m["event_id"].(string); ok {
		return id
	}
	return ""
}
```

**Imports reminder:** the import block of `tracking_service.go` now needs `"bytes"`, `"crypto/sha256"`, `"encoding/hex"`, `"encoding/json"`, `"fmt"`, `"io"`, `"log"`, `"net/http"`, `"strings"`, `"sync"`, `"time"`, plus the existing `config`, `model`, `repository`. Don't import `"github.com/google/uuid"` — it's unused (the struct literal already sets `InvoiceID: &inv.ID` directly, where `inv.ID` is a `uuid.UUID`).

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && go test ./internal/service/ -run 'TestSendMetaCAPI' -v`
Expected: PASS (3 tests: gated-off, success with hashing assertions, HTTP error).

- [ ] **Step 5: Commit**

```bash
git add backend/internal/service/tracking_service.go backend/internal/service/tracking_service_test.go
git commit -m "feat(tracking): Meta CAPI Purchase dispatch with HTTP mock (TDD)"
```

---

## Task 8: TikTok EAPI dispatch + unified SendConversions

**Files:**
- Modify: `backend/internal/service/tracking_service.go`
- Modify: `backend/internal/service/tracking_service_test.go`

- [ ] **Step 1: Write failing test for TikTok dispatch**

Append to `backend/internal/service/tracking_service_test.go`:

```go
var tiktokEAPIURL = "https://business.tiktok.com/open_api/v1.3"
var originalTiktokEAPIURL = "https://business.tiktok.com/open_api/v1.3"

func makeTiktokServer(t *testing.T, status int) (*httptest.Server, *string, *sync.Mutex) {
	var mu sync.Mutex
	body := ""
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		buf := make([]byte, 0)
		tmp := make([]byte, 4096)
		for {
			n, err := r.Body.Read(tmp)
			if n > 0 {
				buf = append(buf, tmp[:n]...)
			}
			if err != nil {
				break
			}
		}
		mu.Lock()
		body = string(buf)
		mu.Unlock()
		// TikTok returns 200 with code 0 on success
		w.WriteHeader(status)
		w.Write([]byte(`{"code":0,"message":"OK","event_id":"tt_evt_1"}`))
	}))
	t.Cleanup(srv.Close)
	return srv, &body, &mu
}

func TestSendTiktokEAPI_GatedOff(t *testing.T) {
	svc := &TrackingService{}
	s := &model.Setting{TiktokEAPIEnabled: false, TiktokPixelID: "px", TiktokAccessToken: "tok"}
	svc.sendTiktokEAPI(s, &model.Invoice{InvoiceNumber: "INV-1"})
	s.TiktokEAPIEnabled = true
	s.TiktokAccessToken = ""
	svc.sendTiktokEAPI(s, &model.Invoice{InvoiceNumber: "INV-1"})
}

func TestSendTiktokEAPI_Success(t *testing.T) {
	srv, bodyPtr, mu := makeTiktokServer(t, http.StatusOK)
	defer func() { tiktokEAPIURL = originalTiktokEAPIURL }()
	originalTiktokEAPIURL = tiktokEAPIURL
	tiktokEAPIURL = srv.URL

	repo := newMockTrackingRepo()
	svc := &TrackingService{repo: repo}
	s := &model.Setting{TiktokEAPIEnabled: true, TiktokPixelID: "PIXEL123", TiktokAccessToken: "tok"}
	inv := &model.Invoice{
		InvoiceNumber: "INV-TT", DonorEmail: "donor@example.com",
		DonorPhone: "081234567890", Total: 100000,
	}
	svc.sendTiktokEAPI(s, inv)

	if len(repo.created) != 1 || !repo.created[0].Success || repo.created[0].Platform != "tiktok" {
		t.Fatalf("unexpected logs: %+v", repo.created)
	}
	mu.Lock()
	b := *bodyPtr
	mu.Unlock()
	if strings.Contains(b, "donor@example.com") || strings.Contains(b, "081234567890") {
		t.Error("plaintext PII leaked into TikTok request body")
	}
	if repo.created[0].RemoteEventID != "tt_evt_1" {
		t.Errorf("remote event id = %q, want tt_evt_1", repo.created[0].RemoteEventID)
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && go test ./internal/service/ -run 'TestSendTiktok' -v`
Expected: FAIL — `undefined: sendTiktokEAPI`.

- [ ] **Step 3: Implement sendTiktokEAPI + unified SendConversions**

Append to `backend/internal/service/tracking_service.go`:

```go
// sendTiktokEAPI posts a CompletePayment event to the TikTok Events API for the given
// paid invoice. No-op unless EAPI enabled and pixel id + access token set. PII hashed.
func (s *TrackingService) sendTiktokEAPI(settings *model.Setting, inv *model.Invoice) {
	if settings == nil || !settings.TiktokEAPIEnabled || settings.TiktokPixelID == "" || settings.TiktokAccessToken == "" {
		return
	}
	if s.repo == nil {
		return
	}

	user := map[string]interface{}{}
	if inv.DonorEmail != "" {
		user["email"] = map[string]string{"sha256": sha256Hex(inv.DonorEmail)}
	}
	if phone := normalizePhoneE164(inv.DonorPhone); phone != "" {
		user["phone"] = map[string]string{"sha256": sha256Hex(phone)}
	}

	payload := map[string]interface{}{
		"event_code": "complete_payment",
		"event":      "CompletePayment",
		"event_time": time.Now().Unix(),
		"event_id":   dedupEventID(inv.InvoiceNumber),
		"user":       user,
		"properties": map[string]interface{}{
			"currency": "IDR",
			"value":    float64(inv.Total) / 100.0,
		},
	}
	if settings.TiktokTestEventCode != "" {
		payload["test_event_code"] = settings.TiktokTestEventCode
	}

	body, _ := json.Marshal(payload)
	url := fmt.Sprintf("%s/event/track/", tiktokEAPIURL)

	lg := &model.TrackingDispatchLog{
		Platform:  "tiktok",
		EventName: "CompletePayment",
		EventID:   dedupEventID(inv.InvoiceNumber),
		InvoiceID: &inv.ID,
	}
	// TikTok wants the token in an Authorization header, not the URL.
	s.httpPostWithHeader(url, body, "Access-Token", settings.TiktokAccessToken, lg)
}

// httpPostWithHeader is like httpPost but adds one extra header (TikTok token).
func (s *TrackingService) httpPostWithHeader(url string, body []byte, hdrKey, hdrVal string, lg *model.TrackingDispatchLog) {
	client := &http.Client{Timeout: 5 * time.Second}
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		lg.Success, lg.ErrorMessage = false, "build request: "+err.Error()
		s.repo.LogDispatch(lg)
		return
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set(hdrKey, hdrVal)

	resp, err := client.Do(req)
	if err != nil {
		lg.Success, lg.ErrorMessage = false, "http: "+err.Error()
		s.repo.LogDispatch(lg)
		return
	}
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	lg.HTTPStatus = resp.StatusCode
	lg.Success = resp.StatusCode >= 200 && resp.StatusCode < 300
	if !lg.Success {
		lg.ErrorMessage = string(respBody)
	} else {
		lg.RemoteEventID = extractRemoteEventID(respBody)
	}
	s.repo.LogDispatch(lg)
}

// SendConversions is the single entry point fired after an invoice is paid. It reads
// settings once, then dispatches to each enabled+configured platform concurrently in a
// goroutine. Panics inside a platform goroutine are recovered so one platform's crash
// never affects the other or the caller. MUST NOT return an error — tracking is
// fire-and-forget relative to payment confirmation.
func (s *TrackingService) SendConversions(inv *model.Invoice) {
	if inv == nil {
		return
	}
	settings, err := s.settingRepo.Get()
	if err != nil || settings == nil {
		return
	}

	var wg sync.WaitGroup
	run := func(name string, fn func()) {
		defer wg.Done()
		defer func() {
			if r := recover(); r != nil {
				log.Printf("[tracking] %s dispatch panic recovered: %v", name, r)
			}
		}()
		fn()
	}

	if settings.MetaCAPIEnabled && settings.MetaPixelID != "" && settings.MetaCAPIToken != "" {
		wg.Add(1)
		go run("meta", func() { s.sendMetaCAPI(settings, inv) })
	}
	if settings.TiktokEAPIEnabled && settings.TiktokPixelID != "" && settings.TiktokAccessToken != "" {
		wg.Add(1)
		go run("tiktok", func() { s.sendTiktokEAPI(settings, inv) })
	}
	wg.Wait()
}
```

Add `"sync"` to the import block of tracking_service.go.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && go test ./internal/service/ -v`
Expected: PASS — all tracking tests (hashing, event_id, Meta gating/success/error, TikTok gating/success).

- [ ] **Step 5: Commit**

```bash
git add backend/internal/service/tracking_service.go backend/internal/service/tracking_service_test.go
git commit -m "feat(tracking): TikTok EAPI dispatch + unified SendConversions (TDD)"
```

---

## Task 9: Wire TrackingService into PaymentService (single hook point)

`ProcessPayment` is the ONE place invoices become paid (called by Flip, Moota, sandbox). Hook here → all payment paths covered uniformly.

**Files:**
- Modify: `backend/internal/service/payment_service.go:13-38` (struct + constructor)
- Modify: `backend/internal/service/payment_service.go:176-182` (after tx commit)
- Modify: `backend/internal/router/router.go:40` (DI)

- [ ] **Step 1: Add trackingSvc to PaymentService**

In `backend/internal/service/payment_service.go`, add a field to the struct (after line 19 `commissionRepo *repository.CommissionRepo`):

```go
	trackingSvc *TrackingService
```

Update the constructor `NewPaymentService` (lines 22-38) to accept and set it:

```go
func NewPaymentService(
	db *gorm.DB,
	invoiceRepo *repository.InvoiceRepo,
	campaignRepo *repository.CampaignRepo,
	settingRepo *repository.SettingRepo,
	fundraiserRepo *repository.FundraiserRepo,
	commissionRepo *repository.CommissionRepo,
	trackingSvc *TrackingService,
) *PaymentService {
	return &PaymentService{
		db:             db,
		invoiceRepo:    invoiceRepo,
		campaignRepo:   campaignRepo,
		settingRepo:    settingRepo,
		fundraiserRepo: fundraiserRepo,
		commissionRepo: commissionRepo,
		trackingSvc:    trackingSvc,
	}
}
```

- [ ] **Step 2: Fire SendConversions after the transaction commits**

In `payment_service.go`, `ProcessPayment` returns from inside `s.db.Transaction(...)`. The return value `nil` at line 181 is reached only after the tx commits successfully. Replace the final return block (lines 176-182):

```go
		// Reflect paid state back to caller's invoice pointer.
		invoice.IsPaid = true
		invoice.Status = lockedInvoice.Status
		invoice.PaidAt = lockedInvoice.PaidAt

		return nil
	})
	if err != nil {
		return err
	}

	// Transaction committed = invoice is genuinely paid. Fire server-side conversion
	// events in a goroutine so a slow/down Meta/TikTok never blocks payment confirmation.
	// Snapshot the invoice value (the pointer may be reused by the caller). Anonymous
	// donations still fire — value/currency + event_id are enough for attribution, and
	// their PII fields are simply empty in the hashed user_data (valid for Meta/TikTok).
	if s.trackingSvc != nil {
		snap := *invoice
		go func() {
			defer func() {
				if r := recover(); r != nil {
					log.Printf("[tracking] SendConversions panic: %v", r)
				}
			}()
			s.trackingSvc.SendConversions(&snap)
		}()
	}
	return nil
}
```

Add `"log"` to the import block of payment_service.go.

- [ ] **Step 3: Wire DI in router.go**

In `backend/internal/router/router.go`, services are constructed around lines 38-57. A circular-dep problem exists: `PaymentService` needs `TrackingService`, but `TrackingService` doesn't need `PaymentService` — so construct tracking FIRST. 

After the repo block (after line 36 `processedWebhookRepo := ...`), add the tracking repo + service before `paymentService`:

```go
	trackingRepo := repository.NewTrackingRepo(db)
	trackingService := service.NewTrackingService(trackingRepo, settingRepo, cfg)
```

Then update the `paymentService` line (line 40) to pass trackingService:

```go
	paymentService := service.NewPaymentService(db, invoiceRepo, campaignRepo, settingRepo, fundraiserRepo, commissionRepo, trackingService)
```

> `settingRepo` is already defined at line 22, so it's in scope. No other call sites of `NewPaymentService` exist.

- [ ] **Step 4: Verify it compiles**

Run: `cd backend && go build ./...`
Expected: no errors.

- [ ] **Step 5: Run the full test suite**

Run: `cd backend && go test ./...`
Expected: PASS — existing tests still green; no test referenced `NewPaymentService` directly (verified: grep showed only router.go constructs it).

- [ ] **Step 6: Commit**

```bash
git add backend/internal/service/payment_service.go backend/internal/router/router.go
git commit -m "feat(tracking): fire SendConversions on invoice paid (single hook point)"
```

---

## Task 10: Status response DTO + handler + route

**Files:**
- Create: `backend/internal/dto/response/tracking.go`
- Create: `backend/internal/handler/tracking_handler.go`
- Modify: `backend/internal/router/router.go` (register route + handler)

- [ ] **Step 1: Create the response shapes**

Create `backend/internal/dto/response/tracking.go`:

```go
package response

import "time"

// TrackingLastEvent is the most recent dispatch attempt for a platform.
type TrackingLastEvent struct {
	At         time.Time `json:"at"`
	Success    bool      `json:"success"`
	HTTPStatus int       `json:"http_status"`
	Error      string    `json:"error,omitempty"`
	EventName  string    `json:"event_name,omitempty"`
}

// TrackingPlatformStatus is one platform's pixel/connection status. The Status field
// drives the dashboard badge per the 4-state rule (active/configured/error/not_connected).
type TrackingPlatformStatus struct {
	Platform       string             `json:"platform"`        // "meta" | "google" | "tiktok"
	Name           string             `json:"name"`            // display label
	Configured     bool               `json:"configured"`      // ID+token set
	Enabled        bool               `json:"enabled"`         // server-side gate flag on
	Status         string             `json:"status"`          // active|configured|error|not_connected
	LastEvent      *TrackingLastEvent `json:"last_event,omitempty"`
	RecentCount24h int64              `json:"recent_count_24h"`
}

// TrackingStatusResponse is the payload of GET /admin/tracking/status.
type TrackingStatusResponse struct {
	Platforms []TrackingPlatformStatus `json:"platforms"`
}
```

- [ ] **Step 2: Create the handler**

Create `backend/internal/handler/tracking_handler.go`:

```go
package handler

import (
	"net/http"

	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/anrdart/niatbaik-api/internal/service"
	"github.com/labstack/echo/v4"
)

type TrackingHandler struct {
	settingRepo  *repository.SettingRepo
	trackingRepo *repository.TrackingRepo
}

func NewTrackingHandler(settingRepo *repository.SettingRepo, trackingRepo *repository.TrackingRepo) *TrackingHandler {
	return &TrackingHandler{settingRepo: settingRepo, trackingRepo: trackingRepo}
}

// GetStatus returns per-platform pixel/connection status, driven by config + the last
// dispatch log. This is the single source of truth for the Advertiser dashboard's
// "Status Pixel" panel (replacing the hardcoded mock badges).
//
// Status rules:
//   not_connected : ID/token empty
//   configured    : configured AND no dispatch log yet (awaiting first paid donation)
//   error         : configured AND last dispatch failed (4xx/5xx)
//   active        : configured AND last dispatch succeeded
func (h *TrackingHandler) GetStatus(c echo.Context) error {
	settings, err := h.settingRepo.Get()
	if err != nil || settings == nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch settings"))
	}

	lastPerPlatform, _ := h.trackingRepo.LastPerPlatform()
	count24h, _ := h.trackingRepo.CountByPlatform24h()

	type plat struct {
		name            string
		idSet, tokenSet bool
		enabled         bool
	}
	// Three platforms surfaced in the dashboard; Google has no server-side CAPI so it
	// reports client-side-only (configured = pixel id set).
	plats := []plat{
		{"meta", settings.MetaPixelID != "", settings.MetaCAPIToken != "", settings.MetaCAPIEnabled},
		{"google", settings.GoogleAdsConversionID != "" || settings.GA4MeasurementID != "", true, true},
		{"tiktok", settings.TiktokPixelID != "", settings.TiktokAccessToken != "", settings.TiktokEAPIEnabled},
	}

	out := make([]response.TrackingPlatformStatus, 0, len(plats))
	for _, p := range plats {
		status := response.TrackingPlatformStatus{
			Platform:       p.name,
			Configured:     p.idSet && p.tokenSet,
			Enabled:        p.enabled,
			RecentCount24h: count24h[p.name],
		}
		var lastEvent *response.TrackingLastEvent
		if last, ok := lastPerPlatform[p.name]; ok {
			lastEvent = &response.TrackingLastEvent{
				At: last.CreatedAt, Success: last.Success,
				HTTPStatus: last.HTTPStatus, Error: last.ErrorMessage, EventName: last.EventName,
			}
		}
		status.LastEvent = lastEvent
		status.Status = classifyStatus(status.Configured, lastEvent)
		out = append(out, status)
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(response.TrackingStatusResponse{Platforms: out}, "success"))
}

// classifyStatus implements the 4-state rule from the spec:
//   not_connected : not configured
//   configured    : configured AND no last event yet
//   error         : configured AND last event failed
//   active        : configured AND last event succeeded
func classifyStatus(configured bool, last *response.TrackingLastEvent) string {
	if !configured {
		return "not_connected"
	}
	if last == nil {
		return "configured"
	}
	if last.Success {
		return "active"
	}
	return "error"
}
```

**Imports for `tracking_handler.go`:** `"net/http"`, `"github.com/anrdart/niatbaik-api/internal/dto/response"`, `"github.com/anrdart/niatbaik-api/internal/repository"`, `"github.com/labstack/echo/v4"`. Do NOT import `service` (the handler only uses repos + response + echo).

- [ ] **Step 3: Register the handler + route in router.go**

In `backend/internal/router/router.go`, the handler block is around lines 60-81. Add after `dataStudioHandler` (line 80):

```go
	trackingHandler := handler.NewTrackingHandler(settingRepo, trackingRepo)
```

(`settingRepo` and `trackingRepo` are both in scope — defined at lines 22 and the new tracking block.)

In the admin route group (after line 189 `admin.GET("/settings/moota-balance", ...)`), add:

```go
	admin.GET("/admin/tracking/status", trackingHandler.GetStatus)
```

- [ ] **Step 4: Verify it compiles**

Run: `cd backend && go build ./...`
Expected: no errors.

- [ ] **Step 5: Manual smoke test (sandbox)**

Start the backend. As admin, hit the endpoint (requires a valid JWT):

Run: `cd backend && go run ./cmd/server &; sleep 2; # obtain a token via login, then: curl -s -H "Authorization: Bearer <token>" http://localhost:8080/api/admin/tracking/status | jq`
Expected: `{"data":{"platforms":[{"platform":"meta","status":"not_connected",...},...]}}` — all three platforms report `not_connected` since no IDs configured yet.

- [ ] **Step 6: Commit**

```bash
git add backend/internal/dto/response/tracking.go backend/internal/handler/tracking_handler.go backend/internal/router/router.go
git commit -m "feat(tracking): GET /admin/tracking/status — real per-platform pixel status"
```

---

## Task 11: Backend — final build + full test gate

**Files:** none (verification only)

- [ ] **Step 1: Full build**

Run: `cd backend && go build ./...`
Expected: no errors.

- [ ] **Step 2: Full test suite**

Run: `cd backend && go vet ./... && go test ./...`
Expected: PASS — all tracking tests + existing flip/setting/campaign tests green.

- [ ] **Step 3: Commit if any goimports/go vet cleanup was needed**

(only if files changed)

```bash
git add -A backend
git commit -m "chore(tracking): vet cleanup"
```

---

## Task 12: Frontend — tracking helper library

**Files:**
- Create: `frontend/src/lib/tracking.jsx`

- [ ] **Step 1: Create the helper**

Create `frontend/src/lib/tracking.jsx`:

```jsx
// Ads tracking helpers for the public donation site.
// - initPixels: injects Meta/GA4/GAds/TikTok/GTM scripts from /settings/public.
// - captureUTM / getUTM: grab utm_* from the URL into sessionStorage so they survive
//   navigation from the campaign page to the invoice/confirmation page.
// - track: fires a client-side funnel event to every configured pixel.

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id'];
const STORE_KEY = 'nb_utm';

// Inject pixel base scripts once. s is the public settings object.
export function initPixels(s) {
  if (!s) return;
  // GTM (loads other tags, including GA4/GAds, if configured in its container)
  if (s.gtm_id && !window.dataLayer) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    injectScript(`https://www.googletagmanager.com/gtm.js?id=${s.gtm_id}`);
  }
  // Meta Pixel
  if (s.meta_pixel_id && !window.fbq) {
    injectFbq(s.meta_pixel_id);
  }
  // GA4 (standalone, if no GTM)
  if (s.ga4_measurement_id && !window.gtag && !s.gtm_id) {
    injectGtag(s.ga4_measurement_id);
  }
  // Google Ads conversion (standalone)
  if (s.google_ads_conversion_id && window.gtag) {
    window.gtag('config', s.google_ads_conversion_id);
  }
  // TikTok Pixel
  if (s.tiktok_pixel_id && !window.ttq) {
    injectTtq(s.tiktok_pixel_id);
  }
}

// Capture utm_* from the current URL once on first landing. Stored so the donation
// POST (which may happen on a different route) still carries attribution.
export function captureUTM() {
  try {
    const params = new URLSearchParams(window.location.search);
    const found = {};
    let any = false;
    UTM_KEYS.forEach((k) => {
      const v = params.get(k);
      if (v) { found[k] = v; any = true; }
    });
    if (any) {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(found));
    }
  } catch { /* sessionStorage unavailable — attribution silently absent */ }
}

// getUTM returns the captured utm params (or {}). Merged into the donation request body.
export function getUTM() {
  try {
    return JSON.parse(sessionStorage.getItem(STORE_KEY) || '{}');
  } catch { return {}; }
}

// track fires a client-side event to every configured pixel. Non-fatal if a pixel
// isn't loaded — it just no-ops for that platform.
export function track(name, payload = {}) {
  try {
    if (window.fbq) window.fbq('track', name, payload);
    if (window.gtag) window.gtag('event', name, payload);
    if (window.ttq) window.ttq.track(name, payload);
  } catch { /* pixel fire must never break the UX */ }
}

// --- private injectors ---

function injectScript(src) {
  const el = document.createElement('script');
  el.async = true;
  el.src = src;
  document.head.appendChild(el);
}

function injectFbq(pixelId) {
  /* eslint-disable */
  (function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)})(window,
  document,'script','https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
}

function injectGtag(measurementId) {
  injectScript(`https://www.googletagmanager.com/gtag/js?id=${measurementId}`);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId);
}

function injectTtq(pixelId) {
  /* eslint-disable */
  (function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
  ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
  ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
  for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
  ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
  ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq.t=ttq.t||{},ttq.t[e]=+new Date,ttq.t[e];var o=d.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
  ttq.load(pixelId);ttq.page()})(window,document,'ttq');
  /* eslint-enable */
}
```

- [ ] **Step 2: Verify the frontend still bundles**

Run: `cd frontend && npm run build`
Expected: build succeeds (the new file is not imported yet, so it's inert — but must be syntactically valid).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/tracking.jsx
git commit -m "feat(tracking): public-site pixel + UTM helper library"
```

---

## Task 13: Public app — init pixels, capture UTM, fire funnel, merge UTM

**Files:**
- Modify: `frontend/src/public/public-app.jsx`

- [ ] **Step 1: Import the helpers + init on settings load**

At the top of `frontend/src/public/public-app.jsx` (after the existing top-level `const`/helpers, before the first component), add the import. This app uses globals + script bundling, so import via the relative path:

```jsx
import { initPixels, captureUTM, getUTM, track } from '../lib/tracking.jsx';
```

> If the project's build doesn't resolve that import (check `frontend` build config), fall back to attaching the helpers to `window` in a build step. First attempt the ESM import — most Vite/esbuild setups resolve it.

Find where public settings are fetched (the `/settings/public` call that populates `window.NB_SETTINGS` or similar). Right after settings are successfully loaded, add:

```jsx
captureUTM();
if (settings) initPixels(settings);
```

- [ ] **Step 2: Fire ViewContent on campaign detail open**

Find the campaign-detail view open (where a single campaign's data is rendered). After the campaign data is set, fire:

```jsx
track('ViewContent', { content_name: campaign.title, content_ids: [campaign.id], value: campaign.target_amount, currency: 'IDR' });
```

- [ ] **Step 3: Fire InitiateCheckout on donation form open**

Find where the donation form modal/view opens. Fire:

```jsx
track('InitiateCheckout', { content_name: campaign.title, value: amount || 0, currency: 'IDR' });
```

- [ ] **Step 4: Fire AddPaymentInfo on method select**

Find where a payment method is selected by the donor. Fire:

```jsx
track('AddPaymentInfo', { content_name: campaign.title, value: amount, currency: 'IDR' });
```

- [ ] **Step 5: Merge UTM into the donation POST**

Find the `createDonation` call (the POST to `/api/donations`). Merge captured UTM into the body:

```jsx
const body = {
  // ...existing fields...
  ...getUTM(), // utm_source, utm_medium, utm_campaign, utm_content, utm_term, utm_id
};
```

- [ ] **Step 6: Verify the frontend builds**

Run: `cd frontend && npm run build`
Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/public/public-app.jsx
git commit -m "feat(tracking): public site — pixel init, UTM capture, funnel events"
```

---

## Task 14: API client — trackingStatus()

**Files:**
- Modify: `frontend/src/api.jsx`

- [ ] **Step 1: Add the endpoint method**

In `frontend/src/api.jsx`, find the `api` object (the collection of endpoint methods). Add:

```jsx
  trackingStatus: () => apiGet('/admin/tracking/status'),
```

> Use the same request helper the file already uses for other admin GETs (`apiGet` / `api.get` — match the existing pattern exactly). Inspect the file's existing `api.dataStudioOverview` style to copy the helper.

- [ ] **Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/api.jsx
git commit -m "feat(tracking): api.trackingStatus()"
```

---

## Task 15: Advertiser dashboard — real status pixel + conversion events

Replace the two hardcoded mock blocks in `advertiser.jsx` with data from `/admin/tracking/status`.

**Files:**
- Modify: `frontend/src/views/advertiser.jsx:106-144`

- [ ] **Step 1: Add state + fetch for tracking status**

In `frontend/src/views/advertiser.jsx`, at the top of `AdvertiserView` (after the existing `useStateA` calls, ~line 6), add:

```jsx
  const [trackingStatus, setTrackingStatus] = useStateA(null);
  useEffectA(() => {
    api.trackingStatus().then((res) => setTrackingStatus(res?.data?.platforms || [])).catch(() => setTrackingStatus([]));
  }, []);
```

- [ ] **Step 2: Replace the hardcoded "Status Pixel" block**

Find the "Status Pixel" card (lines 100-121). Replace the hardcoded `pixels` array literal:

```jsx
            {[
              { n:'Meta Pixel · CAPI', s:'Active', tone:'ok' },
              { n:'Google Tag Manager', s:'Active', tone:'ok' },
              ...
            ].map((p) => ...)}
```

with a render driven by `trackingStatus`:

```jsx
            {(trackingStatus || []).length === 0 && (
              <div className="text-xs text-mute p-3">Memuat status pixel…</div>
            )}
            {(trackingStatus || []).map((p) => {
              const tone = p.status === 'active' ? 'ok' : p.status === 'error' ? 'bad' : p.status === 'configured' ? 'warn' : 'slate';
              const label = p.status === 'active' ? 'Active' : p.status === 'error' ? 'Error' : p.status === 'configured' ? 'Configured' : 'Not Connected';
              const nameMap = { meta: 'Meta Pixel · CAPI', google: 'Google Ads · GA4', tiktok: 'TikTok Pixel · EAPI' };
              return (
                <div key={p.platform} className="flex items-center gap-3 p-2.5 rounded-lg border border-line">
                  <div className={`h-8 w-8 rounded-md flex items-center justify-center ${tone==='ok' ? 'bg-emerald-50 text-emerald-600' : tone==='bad' ? 'bg-rose-50 text-rose-600' : tone==='warn' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}><Icon name="pixel" size={14}/></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-ink text-sm">{nameMap[p.platform] || p.platform}</div>
                    {p.status === 'error' && p.last_event?.error && (
                      <div className="text-[10px] text-rose-600 truncate" title={p.last_event.error}>
                        HTTP {p.last_event.http_status || '?'} · {p.last_event.error.slice(0, 60)}
                      </div>
                    )}
                  </div>
                  <Badge tone={tone} dot={p.status !== 'not_connected'}>{label}</Badge>
                </div>
              );
            })}
```

- [ ] **Step 3: Replace the hardcoded "Conversion Events (24h)" block**

Find the "Conversion Events (24jam)" card (lines 123-144). Replace the hardcoded events array with real per-platform counts:

```jsx
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold text-ink">Conversion Events (24 jam)</div>
            <Badge tone="ok" dot>Server-side</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(trackingStatus || []).map((p) => {
              const colorMap = { meta: '#1877F2', google: '#34A853', tiktok: '#000000' };
              return (
                <div key={p.platform} className="p-3 rounded-lg bg-bg2 border border-line">
                  <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{background: colorMap[p.platform] || '#94A3B8'}}/><div className="text-xs text-mute capitalize">{p.platform}</div></div>
                  <div className="mt-1 text-xl font-bold text-ink">{fmtNum(p.recent_count_24h || 0)}</div>
                </div>
              );
            })}
            {(trackingStatus || []).length === 0 && (
              <div className="col-span-2 text-xs text-mute p-3 text-center">Belum ada event conversion tercatat.</div>
            )}
          </div>
        </Card>
```

- [ ] **Step 4: Verify build**

Run: `cd frontend && npm run build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/views/advertiser.jsx
git commit -m "feat(advertiser): real pixel status + conversion events from backend"
```

---

## Task 16: Settings — credential inputs + token_set indicators

**Files:**
- Modify: `frontend/src/views/settings.jsx:885-1029` (TrackingPanel)

- [ ] **Step 1: Add credential inputs to the pixels list**

In `frontend/src/views/settings.jsx`, the `TrackingPanel` component (line 885). The `pixels` array (lines 890-899) drives display. We need separate secret inputs. Add after the existing `pixelIds` state (line 887), a new state for tokens:

```jsx
  const [tokens, setTokens] = useStateA({});
  const [showTokens, setShowTokens] = useStateA({});
```

In the `useEffectA` that loads `pixelIds` (lines 928-938), also load the token_set indicators (read-only booleans from backend, values are secret):

```jsx
    setTokens({
      hasMetaCAPIToken: settings?.meta_capi_token_set || false,
      hasTiktokAccessToken: settings?.tiktok_access_token_set || false,
    });
```

- [ ] **Step 2: Render credential inputs**

After the existing pixels grid (before the "Meta Pixel & Conversion API (Global)" block, ~line 998), add a credentials card:

```jsx
        {/* Server-side credentials (CAPI / EAPI) — secrets, never echoed back */}
        <div className="mt-5 pt-4 border-t border-line">
          <div className="text-sm font-bold text-ink mb-2">Server-side Conversion Credentials</div>
          <div className="text-xs text-mute mb-3">Token rahasia untuk Meta CAPI & TikTok Events API. Disimpan terenkripsi di server, tidak pernah ditampilkan kembali setelah disimpan.</div>
          {[
            { k:'meta_capi_token', testKey:'meta_test_event_code', label:'Meta CAPI Access Token', placeholder:'EAAG...', set: tokens.hasMetaCAPIToken },
            { k:'tiktok_access_token', testKey:'tiktok_test_event_code', label:'TikTok Events API Token', placeholder:'tt...', set: tokens.hasTiktokAccessToken },
          ].map((c) => (
            <div key={c.k} className="mb-3">
              <label className="text-xs font-semibold text-mute flex items-center gap-1.5">
                {c.label}
                {c.set && <Badge tone="ok" size="sm" dot>Tersimpan</Badge>}
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type={showTokens[c.k] ? 'text' : 'password'}
                  className="field flex-1 font-mono text-xs"
                  placeholder={c.set ? '•••••• (kosongkan jika tidak ingin ganti)' : c.placeholder}
                  onChange={(e) => setPixelIds(prev => ({ ...prev, [c.k]: e.target.value }))}
                />
                <button type="button" className="text-xs font-semibold text-brand-600 hover:underline whitespace-nowrap" onClick={() => setShowTokens(prev => ({ ...prev, [c.k]: !prev[c.k] }))}>
                  {showTokens[c.k] ? 'Sembunyikan' : 'Lihat'}
                </button>
              </div>
              <input
                type="text"
                className="field mt-2 font-mono text-xs"
                placeholder={`${c.label} — Test Event Code (sandbox)`}
                onChange={(e) => setPixelIds(prev => ({ ...prev, [c.testKey]: e.target.value }))}
              />
            </div>
          ))}
        </div>
```

- [ ] **Step 3: Include the new fields in onSave payload**

In the `SaveButton onClick` (lines 1019-1028), add the credential fields to the save payload:

```jsx
          <SaveButton onClick={() => onSave({
            meta_pixel_id: pixelIds['Meta Pixel'] || '',
            meta_capi_enabled: capiEnabled,
            meta_capi_token: pixelIds['meta_capi_token'] || undefined,
            meta_test_event_code: pixelIds['meta_test_event_code'] || undefined,
            event_tracking_config: JSON.stringify(metaEvents),
            gtm_id: pixelIds['Google Tag Manager'] || '',
            google_ads_conversion_id: pixelIds['Google Ads Conversion'] || '',
            ga4_measurement_id: pixelIds['Google Analytics 4'] || '',
            tiktok_pixel_id: pixelIds['TikTok Pixel'] || '',
            tiktok_access_token: pixelIds['tiktok_access_token'] || undefined,
            tiktok_test_event_code: pixelIds['tiktok_test_event_code'] || undefined,
            looker_studio_embed: pixelIds['Looker Studio (Data Studio)'] || '',
          })}>Simpan Semua Tracking</SaveButton>
```

> Using `undefined` when empty means the backend pointer-field mapping (`if req.X != nil`) leaves the existing stored token untouched — critical so re-saving other fields doesn't wipe a saved token.

- [ ] **Step 4: Verify build**

Run: `cd frontend && npm run build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/views/settings.jsx
git commit -m "feat(settings): Meta CAPI + TikTok EAPI credential inputs (secrets)"
```

---

## Task 17: End-to-end verification (sandbox)

**Files:** none (manual verification + docs check)

- [ ] **Step 1: Full build both sides**

Run: `cd backend && go build ./... && cd ../frontend && npm run build`
Expected: both succeed.

- [ ] **Step 2: Run all backend tests**

Run: `cd backend && go test ./...`
Expected: PASS.

- [ ] **Step 3: Migrate + start backend (sandbox)**

Run: `cd backend && APP_ENV=development go run ./cmd/server`
Expected: server starts, `tracking_dispatch_logs` table created by AutoMigrate.

- [ ] **Step 4: Configure a test Meta CAPI token in admin Settings**

Open admin Settings → Tracking & Ads. Enter the Meta Pixel ID + a test access token + Meta test event code (obtain from Meta Events Manager → Test Events). Save. Verify `GET /admin/tracking/status` returns `meta: configured`.

- [ ] **Step 5: Simulate a paid donation (sandbox)**

Run: `curl -X POST http://localhost:8080/api/donations/<invoice>/simulate-payment` (with auth, sandbox only).
Expected: invoice marked paid; a `tracking_dispatch_log` row created for `meta`; `GET /admin/tracking/status` now shows `meta: active` (if Meta returned 200 in test mode) or `meta: error` with the HTTP status (if token wrong — expected for fake tokens).

- [ ] **Step 6: Verify public pixel injection**

Open the public site with `?utm_source=meta&utm_campaign=q2`. Check browser DevTools Network tab for `fbevents.js` / `gtm.js` load. Submit a donation and confirm the invoice row has `utm_source=meta`, `utm_campaign=q2` populated.

- [ ] **Step 7: Verify dashboard reflects real data**

Open Advertiser dashboard. Confirm the "Status Pixel" badges match the backend status (not the old hardcoded mock), and "Conversion Events (24 jam)" shows the count from step 5.

- [ ] **Step 8: Final commit (docs/spec if not yet committed)**

```bash
git add docs/superpowers/specs/2026-06-23-ads-tracking-end-to-end-design.md docs/superpowers/plans/2026-06-23-ads-tracking-end-to-end.md
git commit -m "docs(tracking): design spec + implementation plan"
```

---

## Notes for the implementer

- **Circular dependency:** `TrackingService` is constructed before `PaymentService` in `router.go` (it has no dependency on PaymentService; PaymentService depends on it). Order in the constructor block matters — see Task 9.
- **`metaCAPIURL` / `tiktokEAPIURL` package vars:** kept as overridable vars (not consts) specifically so tests can point them at `httptest.Server`. Don't "refactor" them to consts.
- **Idempotency:** `event_id = invoice_number`. Meta and TikTok both dedup on this. Webhook retries (Flip/Moota re-confirm) will re-fire SendConversions, but the dedup `return nil` in `ProcessPayment` (line 50-52) means the second call won't reach the tracking hook anyway — invoice already marked paid.
- **PII:** email + phone are SHA-256 hashed before leaving the server. Never log the raw PII in dispatch logs (the log stores only platform/event/success/http/remote_event_id/error — NOT user_data).
- **`pixel_events` table (orphan):** intentionally left untouched. New code writes to `tracking_dispatch_log`. Don't add writes to `pixel_events`.
