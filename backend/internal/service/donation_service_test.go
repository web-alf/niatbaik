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

// Donor phone shapes must collapse to one canonical 62-form: the 60s duplicate guard
// and COUNT(DISTINCT donor_phone) both key on this string.
func TestNormalizeWADonorShapes(t *testing.T) {
	for _, tc := range []struct{ in, want string }{
		{"081234567890", "6281234567890"},
		{"+62 812-3456-7890", "6281234567890"},
		{"62 812 3456 7890", "6281234567890"},
		{"81234567890", "6281234567890"},
		{"(0812) 3456-7890", "6281234567890"},
		{"", ""},
	} {
		if got := normalizeWA(tc.in); got != tc.want {
			t.Errorf("normalizeWA(%q) = %q, want %q", tc.in, got, tc.want)
		}
	}
}

func TestIsValidDonorPhone(t *testing.T) {
	valid := []string{
		"628123456789",  // 9-digit national part
		"6281234567890", // 11-digit national part
		"12025550123",   // foreign (US) — length check only
	}
	for _, v := range valid {
		if !isValidDonorPhone(v) {
			t.Errorf("isValidDonorPhone(%q) = false, want true", v)
		}
	}
	invalid := []string{
		"",              // empty
		"6221123456",    // landline 021, not a mobile 8…
		"62812345",      // too short
		"62812345678901234", // too long
		"123",           // foreign but too short
	}
	for _, v := range invalid {
		if isValidDonorPhone(v) {
			t.Errorf("isValidDonorPhone(%q) = true, want false", v)
		}
	}
}
