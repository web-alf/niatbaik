package service

import (
	"testing"
	"time"

	"github.com/anrdart/niatbaik-api/internal/model"
)

func TestInitializeGoogleAdsConversionStatus(t *testing.T) {
	tests := []struct {
		name, gclid, current, want string
	}{
		{"attributed", "gclid-1", "", model.GoogleAdsConversionPendingCredentials},
		{"not attributed", "", "", model.GoogleAdsConversionNotAttributed},
		{"whitespace gclid", "  ", "", model.GoogleAdsConversionNotAttributed},
		{"preserve client", "gclid-1", model.GoogleAdsConversionClientSent, model.GoogleAdsConversionClientSent},
		{"preserve server", "gclid-1", model.GoogleAdsConversionServerSent, model.GoogleAdsConversionServerSent},
		{"preserve failed", "gclid-1", model.GoogleAdsConversionFailed, model.GoogleAdsConversionFailed},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			inv := model.Invoice{Gclid: tt.gclid, GoogleAdsConversionStatus: tt.current}
			initializeGoogleAdsConversionStatus(&inv)
			if inv.GoogleAdsConversionStatus != tt.want {
				t.Fatalf("status = %q, want %q", inv.GoogleAdsConversionStatus, tt.want)
			}
		})
	}
}

func TestClearGoogleAdsConversionAudit(t *testing.T) {
	now := time.Now()
	inv := model.Invoice{
		GoogleAdsConversionStatus:      model.GoogleAdsConversionClientSent,
		GoogleAdsConversionAttemptedAt: &now,
		GoogleAdsConversionSentAt:      &now,
		GoogleAdsConversionError:       "error",
	}
	clearGoogleAdsConversionAudit(&inv)
	if inv.GoogleAdsConversionStatus != "" || inv.GoogleAdsConversionAttemptedAt != nil ||
		inv.GoogleAdsConversionSentAt != nil || inv.GoogleAdsConversionError != "" {
		t.Fatalf("audit not cleared: %#v", inv)
	}
}
