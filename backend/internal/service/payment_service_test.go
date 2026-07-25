package service

import (
	"testing"
	"time"

	"github.com/anrdart/niatbaik-api/internal/model"
)

func TestInitialGoogleAdsServerStatus(t *testing.T) {
	tests := []struct {
		name    string
		inv     model.Invoice
		enabled bool
		want    string
	}{
		{"no click", model.Invoice{}, true, model.GoogleAdsConversionNotAttributed},
		{"disabled", model.Invoice{Gclid: "x"}, false, model.GoogleAdsConversionPendingCredentials},
		{"incomplete", model.Invoice{Gbraid: "x"}, true, model.GoogleAdsConversionPendingCredentials},
		{"ready", model.Invoice{Wbraid: "x", GoogleAdsCustomerIDSnapshot: "1234567890", GoogleAdsConversionActionIDSnapshot: "42"}, true, model.GoogleAdsConversionPendingUpload},
		{"sent stable", model.Invoice{Gclid: "x", GoogleAdsServerStatus: model.GoogleAdsConversionServerSent}, true, model.GoogleAdsConversionServerSent},
		{"accepted untracked stable", model.Invoice{Gclid: "x", GoogleAdsServerStatus: model.GoogleAdsConversionAcceptedUntracked}, true, model.GoogleAdsConversionAcceptedUntracked},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := initialGoogleAdsServerStatus(&tt.inv, tt.enabled); got != tt.want {
				t.Fatalf("got %q want %q", got, tt.want)
			}
		})
	}
}

func TestClearGoogleAdsConversionAudit(t *testing.T) {
	now := time.Now()
	inv := model.Invoice{GoogleAdsServerStatus: model.GoogleAdsConversionRetryable, GoogleAdsClientAttemptedAt: &now, GoogleAdsServerAttemptedAt: &now, GoogleAdsServerSentAt: &now, GoogleAdsServerError: "error", GoogleAdsServerRequestID: "id", GoogleAdsServerAttemptCount: 2, GoogleAdsPollAttemptCount: 3, GoogleAdsServerNextAttemptAt: &now, GoogleAdsServerProcessingAt: &now}
	clearGoogleAdsConversionAudit(&inv)
	if inv.GoogleAdsServerStatus != "" || inv.GoogleAdsClientAttemptedAt != nil || inv.GoogleAdsServerAttemptedAt != nil || inv.GoogleAdsServerSentAt != nil || inv.GoogleAdsServerError != "" || inv.GoogleAdsServerRequestID != "" || inv.GoogleAdsServerAttemptCount != 0 || inv.GoogleAdsPollAttemptCount != 0 || inv.GoogleAdsServerNextAttemptAt != nil || inv.GoogleAdsServerProcessingAt != nil {
		t.Fatalf("audit not cleared: %#v", inv)
	}
}
