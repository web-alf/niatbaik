package service

import (
	"encoding/json"
	"fmt"
	"strings"
	"unicode"

	"github.com/anrdart/niatbaik-api/internal/model"
)

func normalizeGoogleCustomerID(value string, optional bool) (string, error) {
	value = strings.ReplaceAll(strings.TrimSpace(value), "-", "")
	if value == "" && optional {
		return "", nil
	}
	if len(value) != 10 || strings.IndexFunc(value, func(r rune) bool { return !unicode.IsDigit(r) }) >= 0 {
		return "", fmt.Errorf("Google Ads customer ID harus tepat 10 digit")
	}
	return value, nil
}

func normalizeGoogleActionID(value string, optional bool) (string, error) {
	value = strings.TrimSpace(value)
	if value == "" && optional {
		return "", nil
	}
	if value == "" || strings.IndexFunc(value, func(r rune) bool { return !unicode.IsDigit(r) }) >= 0 {
		return "", fmt.Errorf("Google Ads conversion action ID harus numerik")
	}
	return value, nil
}

func selectGoogleAdsIdentifier(inv *model.Invoice) (kind, value string) {
	for _, item := range []struct{ kind, value string }{{"gclid", inv.Gclid}, {"gbraid", inv.Gbraid}, {"wbraid", inv.Wbraid}} {
		if value := strings.TrimSpace(item.value); value != "" {
			return item.kind, value
		}
	}
	return "", ""
}

func initialGoogleAdsServerStatus(inv *model.Invoice, enabled bool) string {
	if inv.GoogleAdsServerStatus == model.GoogleAdsConversionServerSent {
		return inv.GoogleAdsServerStatus
	}
	if _, value := selectGoogleAdsIdentifier(inv); value == "" {
		return model.GoogleAdsConversionNotAttributed
	}
	if !enabled || inv.GoogleAdsCustomerIDSnapshot == "" || inv.GoogleAdsConversionActionIDSnapshot == "" {
		return model.GoogleAdsConversionPendingCredentials
	}
	return model.GoogleAdsConversionPendingUpload
}

func campaignGoogleAdsActionID(raw string) string {
	var cfg struct {
		Gads struct {
			ConversionActionID string `json:"conversion_action_id"`
		} `json:"gads"`
	}
	if json.Unmarshal([]byte(raw), &cfg) != nil {
		return ""
	}
	value, err := normalizeGoogleActionID(cfg.Gads.ConversionActionID, true)
	if err != nil {
		return ""
	}
	return value
}

func ResolveGoogleAdsSnapshot(setting *model.Setting, conversionConfig string) (customer, login, action string, enabled bool) {
	if setting == nil {
		return
	}
	customer, login, action, enabled = setting.GoogleAdsCustomerID, setting.GoogleAdsLoginCustomerID, campaignGoogleAdsActionID(conversionConfig), setting.GoogleAdsServerUploadEnabled
	if action == "" {
		action = setting.GoogleAdsDefaultConversionActionID
	}
	return
}
