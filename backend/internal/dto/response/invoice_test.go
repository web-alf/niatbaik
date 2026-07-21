package response

import (
	"testing"
	"time"

	"github.com/anrdart/niatbaik-api/internal/model"
)

func TestToInvoiceResponseExposesGoogleAdsAudit(t *testing.T) {
	attempted := time.Date(2026, 7, 21, 10, 0, 0, 0, time.UTC)
	sent := attempted.Add(time.Minute)
	inv := &model.Invoice{
		Gclid:                          "gclid-1",
		GAClientID:                     "ga-1",
		GoogleAdsConversionStatus:      model.GoogleAdsConversionServerSent,
		GoogleAdsConversionAttemptedAt: &attempted,
		GoogleAdsConversionSentAt:      &sent,
		GoogleAdsConversionError:       "bounded error",
	}
	got := ToInvoiceResponse(inv)
	if got.Gclid != inv.Gclid || got.GAClientID != inv.GAClientID ||
		got.GoogleAdsConversionStatus != inv.GoogleAdsConversionStatus ||
		got.GoogleAdsConversionAttemptedAt != inv.GoogleAdsConversionAttemptedAt ||
		got.GoogleAdsConversionSentAt != inv.GoogleAdsConversionSentAt ||
		got.GoogleAdsConversionError != inv.GoogleAdsConversionError {
		t.Fatalf("audit mapping mismatch: %#v", got)
	}
}
