package service

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/anrdart/niatbaik-api/internal/config"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
)

// metaCAPIURL / tiktokEAPIURL are overridable in tests; default to the real endpoints.
var (
	metaCAPIURL = "https://graph.facebook.com/v18.0"
	// Events API host is business-api.tiktok.com — business.tiktok.com is the console UI
	// and does NOT serve the API (requests redirect/fail), so no server event lands.
	tiktokEAPIURL = "https://business-api.tiktok.com/open_api/v1.3"
)

// dispatchLogger is the subset of TrackingRepo the dispatch methods need. Defined as
// an interface so unit tests inject a fake without a DB.
type dispatchLogger interface {
	LogDispatch(log *model.TrackingDispatchLog)
}

// TrackingService sends server-side conversion events (Purchase) to ad platforms when
// an invoice is paid, and records each attempt to tracking_dispatch_logs. It is the
// source of truth for the dashboard's per-platform "active/error" pixel status.
type TrackingService struct {
	repo        dispatchLogger
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
	// strip internal whitespace/dashes that donors sometimes paste
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

// metaFbc returns the Meta `fbc` click-id parameter. If the value already looks like a
// fully-formed fbc cookie (fb.1.<ts>.<fbclid>, captured from the browser's _fbc cookie),
// it's returned as-is; otherwise a raw fbclid query param is wrapped into that format.
// Empty in → empty out (so no fbc key is sent for organic traffic).
func metaFbc(v string) string {
	v = strings.TrimSpace(v)
	if v == "" {
		return ""
	}
	if strings.HasPrefix(v, "fb.") {
		return v
	}
	return fmt.Sprintf("fb.1.%d.%s", time.Now().UnixMilli(), v)
}

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
	// Click-level attribution: fbc/fbp are NOT hashed (Meta matches them raw). Prefer the
	// browser _fbc cookie (already in Meta's fb.1.<ts>.<fbclid> form); fall back to building
	// fbc from the raw fbclid query param.
	if inv.Fbp != "" {
		userData["fbp"] = inv.Fbp
	}
	if fbc := metaFbc(inv.Fbclid); fbc != "" {
		userData["fbc"] = fbc
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
				// IDR has no minor unit and Invoice.Total is stored in WHOLE rupiah, so send
				// it as-is. Dividing by 100 reported every conversion at 1/100th its value
				// and broke ROAS / value-based bidding in the dashboard.
				"value": float64(inv.Total),
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
	// Meta/TikTok return 2xx on success; anything else is a failure.
	lg.Success = resp.StatusCode >= 200 && resp.StatusCode < 300
	if !lg.Success {
		lg.ErrorMessage = string(respBody)
	} else {
		lg.RemoteEventID = extractRemoteEventID(respBody)
	}
	s.repo.LogDispatch(lg)
}

// extractRemoteEventID pulls the platform event id out of a success response body
// (best-effort; Meta and TikTok use different shapes).
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
	// Click-level attribution (raw, not hashed): ttclid from the ad click, ttp from the
	// TikTok pixel cookie.
	if inv.Ttclid != "" {
		user["ttclid"] = inv.Ttclid
	}
	if inv.Ttp != "" {
		user["ttp"] = inv.Ttp
	}

	payload := map[string]interface{}{
		"event_code": "complete_payment",
		"event":      "CompletePayment",
		"event_time": time.Now().Unix(),
		"event_id":   dedupEventID(inv.InvoiceNumber),
		"user":       user,
		"properties": map[string]interface{}{
			"currency": "IDR",
			// Whole-rupiah, no minor unit — send as-is (dividing by 100 under-reported 100x).
			"value": float64(inv.Total),
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
