package handler

import (
	"errors"
	"strings"
	"testing"

	"github.com/anrdart/niatbaik-api/internal/service"
)

func TestSafeGoogleAdsTestError(t *testing.T) {
	dispatch := &service.DispatchError{Category: "oauth_rejected", Summary: "upstream HTTP 401"}
	if got := safeGoogleAdsTestError(dispatch); got != "Google Data Manager: oauth_rejected (upstream HTTP 401)" {
		t.Fatalf("got %q", got)
	}
	unknown := safeGoogleAdsTestError(errors.New("token=secret click=gclid"))
	if unknown != "Google Data Manager menolak validasi" || strings.Contains(unknown, "secret") {
		t.Fatalf("unsafe unknown error: %q", unknown)
	}
}
