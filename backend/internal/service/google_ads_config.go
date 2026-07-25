package service

import (
	"encoding/json"
	"fmt"
	"strings"
	"unicode"

	"github.com/anrdart/niatbaik-api/internal/model"
)

// googleAdsReadinessError names the single missing prerequisite so an operator can
// act on the 422 without reading server logs. Order matters: environment secrets
// first, because the other three are pointless without them.
func googleAdsReadinessError(credentialsConfigured bool, customerID, actionID string, clientReady bool) error {
	switch {
	case !credentialsConfigured:
		return fmt.Errorf("%w: OAuth environment variables Google Ads belum lengkap di backend", ErrValidation)
	case strings.TrimSpace(customerID) == "":
		return fmt.Errorf("%w: Customer ID belum tersimpan, isi lalu simpan pengaturan terlebih dahulu", ErrValidation)
	case strings.TrimSpace(actionID) == "":
		return fmt.Errorf("%w: Default Conversion Action ID belum tersimpan, isi lalu simpan pengaturan terlebih dahulu", ErrValidation)
	case !clientReady:
		return fmt.Errorf("%w: Data Manager client tidak aktif di server", ErrValidation)
	}
	return nil
}

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
	if inv.GoogleAdsServerStatus == model.GoogleAdsConversionServerSent || inv.GoogleAdsServerStatus == model.GoogleAdsConversionAcceptedUntracked {
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
