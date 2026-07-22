package service

import (
	"testing"
	"time"

	"github.com/anrdart/niatbaik-api/internal/model"
)

func TestGoogleAdsClientDispatchIndependent(t *testing.T) {
	now := time.Date(2026, 7, 21, 10, 0, 0, 0, time.UTC)
	inv := &model.Invoice{IsPaid: true, Gbraid: "click", GoogleAdsServerStatus: model.GoogleAdsConversionPendingUpload}
	if err := acknowledgeGoogleAdsClientDispatch(inv, now); err != nil {
		t.Fatal(err)
	}
	if inv.GoogleAdsClientAttemptedAt == nil || !inv.GoogleAdsClientAttemptedAt.Equal(now) {
		t.Fatal("client attempt missing")
	}
	if inv.GoogleAdsServerStatus != model.GoogleAdsConversionPendingUpload {
		t.Fatal("server status changed")
	}
	first := inv.GoogleAdsClientAttemptedAt
	if err := acknowledgeGoogleAdsClientDispatch(inv, now.Add(time.Hour)); err != nil {
		t.Fatal(err)
	}
	if inv.GoogleAdsClientAttemptedAt != first {
		t.Fatal("attempt timestamp changed")
	}
}

func TestGoogleAdsClientDispatchGuards(t *testing.T) {
	for i, inv := range []model.Invoice{{Gclid: "click"}, {IsPaid: true}} {
		if err := acknowledgeGoogleAdsClientDispatch(&inv, time.Now()); err == nil {
			t.Fatalf("case %d: expected error", i)
		}
	}
}
