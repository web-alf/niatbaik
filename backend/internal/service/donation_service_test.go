package service

import (
	"testing"
	"time"

	"github.com/anrdart/niatbaik-api/internal/model"
)

func TestAcknowledgeGoogleAdsClientDispatch(t *testing.T) {
	now := time.Date(2026, 7, 21, 10, 0, 0, 0, time.UTC)
	inv := &model.Invoice{IsPaid: true, GoogleAdsConversionStatus: model.GoogleAdsConversionPendingCredentials}
	if err := acknowledgeGoogleAdsClientDispatch(inv, now); err != nil {
		t.Fatal(err)
	}
	if inv.GoogleAdsConversionStatus != model.GoogleAdsConversionClientSent ||
		inv.GoogleAdsConversionAttemptedAt == nil || !inv.GoogleAdsConversionAttemptedAt.Equal(now) {
		t.Fatalf("unexpected invoice: %#v", inv)
	}
	first := inv.GoogleAdsConversionAttemptedAt
	if err := acknowledgeGoogleAdsClientDispatch(inv, now.Add(time.Hour)); err != nil {
		t.Fatal(err)
	}
	if inv.GoogleAdsConversionAttemptedAt != first {
		t.Fatal("attempt timestamp changed")
	}
}

func TestAcknowledgeGoogleAdsClientDispatchRejectsInvalidState(t *testing.T) {
	tests := []model.Invoice{
		{GoogleAdsConversionStatus: model.GoogleAdsConversionPendingCredentials},
		{IsPaid: true, GoogleAdsConversionStatus: model.GoogleAdsConversionNotAttributed},
	}
	for i := range tests {
		if err := acknowledgeGoogleAdsClientDispatch(&tests[i], time.Now()); err == nil {
			t.Fatalf("case %d: expected error", i)
		}
	}
}

func TestAcknowledgeGoogleAdsClientDispatchPreservesTerminalState(t *testing.T) {
	for _, status := range []string{model.GoogleAdsConversionServerSent, model.GoogleAdsConversionFailed} {
		inv := &model.Invoice{IsPaid: true, GoogleAdsConversionStatus: status}
		if err := acknowledgeGoogleAdsClientDispatch(inv, time.Now()); err != nil {
			t.Fatal(err)
		}
		if inv.GoogleAdsConversionStatus != status {
			t.Fatalf("status = %q, want %q", inv.GoogleAdsConversionStatus, status)
		}
	}
}
