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
	"github.com/google/uuid"
)

// metaCAPIURL / tiktokEAPIURL are overridable in tests; default to the real endpoints.
var (
	// Graph API version. v18.0 sunset 26 Jan 2026 → every /events call 400'd (err 2635
	// "deprecated version"), silently killing all server-side Purchase events. Meta sunsets
	// a version ~2yr after release; v23.0 (May 2025) runs into 2027. Bump before it expires.
	metaCAPIURL = "https://graph.facebook.com/v23.0"
	// Events API host is business-api.tiktok.com — business.tiktok.com is the console UI
	// and does NOT serve the API (requests redirect/fail), so no server event lands.
	tiktokEAPIURL = "https://business-api.tiktok.com/open_api/v1.3"
	ga4MPURL      = "https://www.google-analytics.com/mp/collect"
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

// metaCreds holds the resolved Meta pixel id + CAPI token + test-event code for one
// dispatch: the invoice's campaign overrides the global settings when it has its own.
type metaCreds struct {
	pixelID   string
	token     string
	testEvent string
	source    string // "campaign" or "global" (for the dispatch log / debugging)
}

// campaignPixelConfig is the shape of Campaign.PixelConfig JSON authored by the campaign
// editor: {"capi":true,"token":"EAA...","test_event":"TEST123","events":{...}}.
type campaignPixelConfig struct {
	Capi      bool   `json:"capi"`
	Token     string `json:"token"`
	TestEvent string `json:"test_event"`
}

// resolveMetaCreds picks per-campaign Meta CAPI credentials when the invoice's campaign
// has its own pixel id + a valid CAPI block in PixelConfig; otherwise falls back to the
// global settings. Returns ok=false when neither is usable (dispatch skipped).
func resolveMetaCreds(settings *model.Setting, inv *model.Invoice) (metaCreds, bool) {
	// Campaign override: requires a preloaded campaign (ID != nil), its own pixel id, and
	// a PixelConfig with capi:true + a token. Per-campaign server dispatch does NOT require
	// the global MetaCAPIEnabled toggle.
	if inv.Campaign.ID != uuid.Nil && inv.Campaign.MetaPixelID != "" && inv.Campaign.PixelConfig != "" {
		var pc campaignPixelConfig
		if json.Unmarshal([]byte(inv.Campaign.PixelConfig), &pc) == nil && pc.Capi && strings.TrimSpace(pc.Token) != "" {
			return metaCreds{pixelID: inv.Campaign.MetaPixelID, token: pc.Token, testEvent: pc.TestEvent, source: "campaign"}, true
		}
	}
	// Global fallback: gated by the global enable toggle + creds.
	if settings != nil && settings.MetaCAPIEnabled && settings.MetaPixelID != "" && settings.MetaCAPIToken != "" {
		return metaCreds{pixelID: settings.MetaPixelID, token: settings.MetaCAPIToken, testEvent: settings.MetaTestEventCode, source: "global"}, true
	}
	return metaCreds{}, false
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

// metaSourceURL builds the event_source_url Meta requires for action_source=website.
// Uses the public campaign page (/c/<slug>) when the campaign is preloaded, else the site
// origin. Omitting it lowers Event Match Quality and browser↔server dedup.
func (s *TrackingService) metaSourceURL(inv *model.Invoice) string {
	base := ""
	if s.cfg != nil {
		base = s.cfg.FrontendBaseURL
	}
	if inv.Campaign.Slug != "" {
		return fmt.Sprintf("%s/c/%s", base, inv.Campaign.Slug)
	}
	return base
}

// sendMetaCAPI posts a Purchase event to the Meta Conversions API for the given paid
// invoice. No-op unless CAPI is enabled and both pixel id + access token are set.
// PII (email/phone) is SHA-256 hashed. The event_id is the invoice number so Meta
// dedups retries. Errors are caught and logged as a failed dispatch — never returned.
func (s *TrackingService) sendMetaCAPI(settings *model.Setting, inv *model.Invoice) {
	if s.repo == nil {
		return
	}
	// Per-campaign pixel/token override with global fallback (skips if neither usable).
	creds, ok := resolveMetaCreds(settings, inv)
	if !ok {
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
	// Meta requires >=1 customer-info key in user_data or it 400s the whole event. An
	// organic donor with no email/phone and no fbp/fbc yields {} — skip (it can't match).
	if len(userData) == 0 {
		return
	}

	payload := map[string]interface{}{
		"data": []map[string]interface{}{{
			"event_name":       "Purchase",
			"event_time":       time.Now().Unix(),
			"event_id":         dedupEventID(inv.InvoiceNumber),
			"action_source":    "website",
			"event_source_url": s.metaSourceURL(inv),
			"user_data":        userData,
			"custom_data": map[string]interface{}{
				"currency": "IDR",
				// IDR has no minor unit and Invoice.Total is stored in WHOLE rupiah, so send
				// it as-is. Dividing by 100 reported every conversion at 1/100th its value
				// and broke ROAS / value-based bidding in the dashboard.
				"value": float64(inv.Total),
			},
		}},
	}
	if creds.testEvent != "" {
		payload["test_event_code"] = creds.testEvent
	}

	body, _ := json.Marshal(payload)
	url := fmt.Sprintf("%s/%s/events?access_token=%s", metaCAPIURL, creds.pixelID, creds.token)

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
// paid invoice. No-op unless pixel id + access token are set (presence-gated, same as
// GA4 — there is no separate enable toggle in the UI). PII hashed.
func (s *TrackingService) sendTiktokEAPI(settings *model.Setting, inv *model.Invoice) {
	if settings == nil || settings.TiktokPixelID == "" || settings.TiktokAccessToken == "" {
		return
	}
	if s.repo == nil {
		return
	}

	// Events API 2.0 hashes PII as raw lowercase-hex SHA-256 STRINGS (not {"sha256":...}
	// objects — that older shape is silently unmatched).
	user := map[string]interface{}{}
	if inv.DonorEmail != "" {
		user["email"] = sha256Hex(inv.DonorEmail)
	}
	if phone := normalizePhoneE164(inv.DonorPhone); phone != "" {
		user["phone"] = sha256Hex(phone)
	}
	// Click-level attribution (raw, not hashed): ttclid from the ad click, ttp from the
	// TikTok pixel cookie.
	if inv.Ttclid != "" {
		user["ttclid"] = inv.Ttclid
	}
	if inv.Ttp != "" {
		user["ttp"] = inv.Ttp
	}

	// Events API 2.0 envelope: top-level event_source + event_source_id (the pixel/dataset
	// code — previously sent NOWHERE, so TikTok could never attribute the event), and the
	// event(s) wrapped in a "data" array. The old flat body with a bogus "event_code" field
	// was rejected on every dispatch.
	event := map[string]interface{}{
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
	payload := map[string]interface{}{
		"event_source":    "web",
		"event_source_id": settings.TiktokPixelID,
		"data":            []map[string]interface{}{event},
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

// sendGA4MP posts a server-side "purchase" event to GA4 via the Measurement Protocol.
// GA4 dedups against the browser gtag purchase by transaction_id (= invoice number), and
// (once the GA4 property is linked to Google Ads and the purchase key-event imported) the
// conversion flows through to Google Ads — a lightweight server path without the full
// Google Ads API OAuth. Skips unless both the measurement id and MP api_secret are set.
func (s *TrackingService) sendGA4MP(settings *model.Setting, inv *model.Invoice) {
	if settings == nil || settings.GA4MeasurementID == "" || settings.GA4APISecret == "" || s.repo == nil {
		return
	}
	// client_id MUST be the id the GA tag generated (from the _ga cookie) or GA4 spins up a
	// fresh session-less pseudo-user with no traffic source — the server purchase lands as
	// (direct) and never reaches the linked Google Ads account. Fall back to the invoice
	// number only when the cookie wasn't captured (still dedups via transaction_id).
	clientID := inv.GAClientID
	if clientID == "" {
		clientID = inv.InvoiceNumber
	}
	payload := map[string]interface{}{
		"client_id": clientID,
		"events": []map[string]interface{}{{
			"name": "purchase",
			"params": map[string]interface{}{
				"transaction_id": inv.InvoiceNumber,
				"value":          float64(inv.Total),
				"currency":       "IDR",
			},
		}},
	}
	body, _ := json.Marshal(payload)
	url := fmt.Sprintf("%s?measurement_id=%s&api_secret=%s", ga4MPURL, settings.GA4MeasurementID, settings.GA4APISecret)
	lg := &model.TrackingDispatchLog{
		// Logged under "google" (not "ga4") because GetStatus keys the Google dashboard row
		// on "google"; a "ga4" row would never surface in the status panel.
		Platform:  "google",
		EventName: "purchase",
		EventID:   dedupEventID(inv.InvoiceNumber),
		InvoiceID: &inv.ID,
	}
	s.httpPost(url, body, lg)
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
	// TikTok returns HTTP 200 even on logical failure (bad token, bad event_source_id,
	// malformed body), signalling the real result in the JSON body's top-level "code" (0 =
	// ok). Trusting 2xx alone logged every rejected event as a success → false "active" in
	// the status panel. Require both 2xx AND code==0.
	lg.Success = resp.StatusCode >= 200 && resp.StatusCode < 300 && tiktokBodyOK(respBody)
	if !lg.Success {
		lg.ErrorMessage = string(respBody)
	} else {
		lg.RemoteEventID = extractRemoteEventID(respBody)
	}
	s.repo.LogDispatch(lg)
}

// tiktokBodyOK reports whether a TikTok Events API response body indicates logical success
// (top-level "code" == 0). JSON numbers decode to float64. A body that doesn't parse or
// lacks "code" is treated as NOT ok, so a garbled/unexpected response isn't logged green.
func tiktokBodyOK(body []byte) bool {
	var m map[string]interface{}
	if err := json.Unmarshal(body, &m); err != nil {
		return false
	}
	code, ok := m["code"].(float64)
	return ok && code == 0
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

	// Meta fires when EITHER the global CAPI is configured OR the invoice's campaign has
	// its own pixel+token (per-campaign override doesn't need the global toggle).
	if _, ok := resolveMetaCreds(settings, inv); ok {
		wg.Add(1)
		go run("meta", func() { s.sendMetaCAPI(settings, inv) })
	}
	if settings.TiktokPixelID != "" && settings.TiktokAccessToken != "" {
		wg.Add(1)
		go run("tiktok", func() { s.sendTiktokEAPI(settings, inv) })
	}
	if settings.GA4MeasurementID != "" && settings.GA4APISecret != "" {
		wg.Add(1)
		go run("ga4", func() { s.sendGA4MP(settings, inv) })
	}
	wg.Wait()
}
