package service

import (
	"encoding/json"
	"strings"
	"testing"
)

func trackerCount(t *testing.T, raw string) int {
	t.Helper()
	if raw == "" {
		return 0
	}
	var arr []map[string]any
	if err := json.Unmarshal([]byte(raw), &arr); err != nil {
		t.Fatalf("output not a JSON array: %q (%v)", raw, err)
	}
	return len(arr)
}

func TestNormalizeTrackingConfigEmpty(t *testing.T) {
	for _, in := range []string{"", "   ", "[]"} {
		out, err := normalizeTrackingConfig(in)
		if err != nil {
			t.Fatalf("%q: unexpected error %v", in, err)
		}
		if trackerCount(t, out) != 0 {
			t.Fatalf("%q: want empty, got %q", in, out)
		}
	}
}

func TestNormalizeTrackingConfigAcceptsMultipleSameType(t *testing.T) {
	in := `[
		{"type":"gtm","value":"GTM-AAAA111"},
		{"type":"gtm","value":"GTM-BBBB222"},
		{"type":"google_ads","value":"AW-100","label":"abc-DEF_1"},
		{"type":"google_ads","value":"200","label":"xyz-9"},
		{"type":"meta","value":"123456789"},
		{"type":"ga4","value":"G-ABCDE12"},
		{"type":"tiktok","value":"CABC123DEF"}
	]`
	out, err := normalizeTrackingConfig(in)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got := trackerCount(t, out); got != 7 {
		t.Fatalf("want 7 trackers, got %d (%s)", got, out)
	}
	// bare numeric google_ads value must be normalized to AW-<n>
	if !strings.Contains(out, `"AW-200"`) {
		t.Fatalf("google_ads value not normalized to AW-: %s", out)
	}
}

func TestNormalizeTrackingConfigRejectsBadShapeAndValues(t *testing.T) {
	bad := []string{
		`{"type":"gtm","value":"GTM-X"}`,                             // object, not array
		`[{"type":"unknown","value":"x"}]`,                           // type not whitelisted
		`[{"type":"gtm","value":"nope"}]`,                            // fails gtm regex
		`[{"type":"ga4","value":"AW-123"}]`,                          // wrong pattern for ga4
		`[{"type":"meta","value":"12"}]`,                             // too short for meta
		`[{"type":"google_ads","value":"AW-1"}]`,                     // google_ads missing label
		`[{"type":"google_ads","value":"AW-1","label":"has space"}]`, // bad label
		`not json`,
	}
	for _, in := range bad {
		if _, err := normalizeTrackingConfig(in); err == nil {
			t.Fatalf("expected rejection for %q", in)
		}
	}
}

func TestNormalizeTrackingConfigRejectsForbiddenKeys(t *testing.T) {
	in := `[{"type":"gtm","value":"GTM-AAAA111","refresh_token":"leak"}]`
	if _, err := normalizeTrackingConfig(in); err == nil {
		t.Fatal("expected forbidden-key rejection")
	}
}

func TestNormalizeTrackingConfigDedupesAndDropsForeignFields(t *testing.T) {
	in := `[
		{"type":"gtm","value":"GTM-AAAA111","note":"drop me"},
		{"type":"gtm","value":"GTM-AAAA111"}
	]`
	out, err := normalizeTrackingConfig(in)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got := trackerCount(t, out); got != 1 {
		t.Fatalf("want 1 after dedup, got %d (%s)", got, out)
	}
	if strings.Contains(out, "note") || strings.Contains(out, "drop me") {
		t.Fatalf("foreign field leaked into output: %s", out)
	}
}

func TestNormalizeTrackingConfigEnforcesLimit(t *testing.T) {
	var parts []string
	for i := 0; i < maxTrackers+5; i++ {
		parts = append(parts, `{"type":"meta","value":"10000000`+string(rune('0'+i%10))+`"}`)
	}
	in := "[" + strings.Join(parts, ",") + "]"
	if _, err := normalizeTrackingConfig(in); err == nil {
		t.Fatalf("expected rejection past limit of %d", maxTrackers)
	}
}

func TestNormalizeTrackingConfigScopeGlobalDefaultAndCampaigns(t *testing.T) {
	in := `[
		{"type":"gtm","value":"GTM-AAAA111"},
		{"type":"meta","value":"123456789","scope":"campaigns","campaigns":["wakaf-sumur","yatim"]},
		{"type":"ga4","value":"G-ABCDE12","scope":"off"}
	]`
	out, err := normalizeTrackingConfig(in)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	var arr []map[string]any
	if err := json.Unmarshal([]byte(out), &arr); err != nil {
		t.Fatal(err)
	}
	if arr[0]["scope"] != "global" {
		t.Fatalf("missing scope default global: %v", arr[0])
	}
	if arr[1]["scope"] != "campaigns" {
		t.Fatalf("want campaigns scope: %v", arr[1])
	}
	camps, _ := arr[1]["campaigns"].([]any)
	if len(camps) != 2 {
		t.Fatalf("want 2 campaigns, got %v", arr[1]["campaigns"])
	}
	if arr[2]["scope"] != "off" {
		t.Fatalf("want off scope: %v", arr[2])
	}
	// global/off entries must not carry a campaigns array
	if _, ok := arr[0]["campaigns"]; ok {
		t.Fatalf("global tracker must not carry campaigns: %v", arr[0])
	}
}

func TestNormalizeTrackingConfigScopeRejections(t *testing.T) {
	bad := []string{
		`[{"type":"gtm","value":"GTM-A1","scope":"weird"}]`,                               // unknown scope
		`[{"type":"gtm","value":"GTM-A1","scope":"campaigns"}]`,                           // campaigns scope, no campaigns
		`[{"type":"gtm","value":"GTM-A1","scope":"campaigns","campaigns":[]}]`,            // empty
		`[{"type":"gtm","value":"GTM-A1","scope":"campaigns","campaigns":["bad slug!"]}]`, // bad slug chars
	}
	for _, in := range bad {
		if _, err := normalizeTrackingConfig(in); err == nil {
			t.Fatalf("expected rejection for %q", in)
		}
	}
}

func TestNormalizeTrackingConfigDedupesCampaigns(t *testing.T) {
	in := `[{"type":"gtm","value":"GTM-A1","scope":"campaigns","campaigns":["a","a","b"]}]`
	out, err := normalizeTrackingConfig(in)
	if err != nil {
		t.Fatal(err)
	}
	var arr []map[string]any
	_ = json.Unmarshal([]byte(out), &arr)
	if camps, _ := arr[0]["campaigns"].([]any); len(camps) != 2 {
		t.Fatalf("campaigns not deduped: %v", arr[0]["campaigns"])
	}
}
