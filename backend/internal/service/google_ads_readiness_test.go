package service

import (
	"strings"
	"testing"
)

func TestGoogleAdsReadinessErrorNamesTheMissingPiece(t *testing.T) {
	cases := []struct {
		name            string
		credsConfigured bool
		customerID      string
		actionID        string
		clientReady     bool
		wantSubstr      string
	}{
		{"env secrets missing", false, "3067980562", "385514488", true, "OAuth"},
		{"customer id missing", true, "", "385514488", true, "Customer ID"},
		{"action id missing", true, "3067980562", "", true, "Conversion Action ID"},
		{"client not initialised", true, "3067980562", "385514488", false, "Data Manager client"},
		{"all present", true, "3067980562", "385514488", true, ""},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			err := googleAdsReadinessError(tc.credsConfigured, tc.customerID, tc.actionID, tc.clientReady)
			if tc.wantSubstr == "" {
				if err != nil {
					t.Fatalf("want nil, got %v", err)
				}
				return
			}
			if err == nil {
				t.Fatalf("want error containing %q, got nil", tc.wantSubstr)
			}
			if !strings.Contains(err.Error(), tc.wantSubstr) {
				t.Fatalf("want error containing %q, got %q", tc.wantSubstr, err.Error())
			}
		})
	}
}
