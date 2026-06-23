package service

import (
	"crypto/sha256"
	"encoding/hex"
	"strings"

	"github.com/anrdart/niatbaik-api/internal/config"
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
