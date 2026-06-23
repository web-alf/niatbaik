package service

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/anrdart/niatbaik-api/internal/config"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
)

// metaCAPIURL is overridable in tests; defaults to the real Meta Graph endpoint.
var metaCAPIURL = "https://graph.facebook.com/v18.0"

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
