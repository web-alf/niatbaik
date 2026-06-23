package service

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"

	"github.com/anrdart/niatbaik-api/internal/model"
)

func TestSha256Hex(t *testing.T) {
	cases := map[string]string{
		// well-known sha256("abc") test vector
		"abc": "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
		// sha256("") empty string vector
		"": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
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
		"081234567890":    "+6281234567890",
		"6281234567890":   "+6281234567890",
		"+6281234567890":  "+6281234567890",
		" 0812 3456 7890 ": "+6281234567890", // spaces stripped
		"0215551234":      "+62215551234",
		"":                "", // empty stays empty (donor with no phone)
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

// --- Meta CAPI dispatch tests ---

// makeMetaServer returns a test server that records the request body and responds
// with the given status. Returns (server, receivedBody, mu).
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
	svc.sendMetaCAPI(s, &model.Invoice{InvoiceNumber: "INV-1"})
	// enabled but no token → also skip
	s.MetaCAPIEnabled = true
	s.MetaCAPIToken = ""
	svc.sendMetaCAPI(s, &model.Invoice{InvoiceNumber: "INV-1"})
}

// sendMetaCAPI on HTTP 200 writes a success dispatch log entry and hashes PII.
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
	if lg.RemoteEventID != "evt_123" {
		t.Errorf("remote_event_id = %q, want evt_123", lg.RemoteEventID)
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

// --- TikTok EAPI dispatch tests ---

// makeTiktokServer returns a test server recording the body, responding with status.
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
		// TikTok returns 200 with code 0 on success; event_id in body.
		w.WriteHeader(status)
		w.Write([]byte(`{"code":0,"message":"OK","event_id":"tt_evt_1"}`))
	}))
	t.Cleanup(srv.Close)
	return srv, &body, &mu
}

// originalTiktokEAPIURL saves the production TikTok endpoint for restore.
var originalTiktokEAPIURL = tiktokEAPIURL

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
	if repo.created[0].RemoteEventID != "tt_evt_1" {
		t.Errorf("remote event id = %q, want tt_evt_1", repo.created[0].RemoteEventID)
	}
	mu.Lock()
	b := *bodyPtr
	mu.Unlock()
	if strings.Contains(b, "donor@example.com") || strings.Contains(b, "081234567890") {
		t.Error("plaintext PII leaked into TikTok request body")
	}
}

// --- test doubles ---

// metaCAPIURL is declared in tracking_service.go; tests override it to point at a
// local httptest.Server. originalMetaCAPIURL saves the production value for restore.
var originalMetaCAPIURL = metaCAPIURL

type mockTrackingRepo struct {
	created []*model.TrackingDispatchLog
}

func newMockTrackingRepo() *mockTrackingRepo {
	return &mockTrackingRepo{}
}

func (m *mockTrackingRepo) LogDispatch(l *model.TrackingDispatchLog) {
	m.created = append(m.created, l)
}
