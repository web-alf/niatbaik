package service

import (
	"strings"
	"testing"
)

func TestSha256Hex(t *testing.T) {
	cases := map[string]string{
		// well-known sha256("abc") test vector
		"abc": "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
		// sha256("") empty string vector
		"": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
	}
	for in, want := range cases {
		if got := sha256Hex(in); got != want {
			t.Errorf("sha256Hex(%q) = %q, want %q", in, got, want)
		}
	}
}

// sha256Hex must lowercase + trim before hashing, matching Meta/TikTok advanced matching.
func TestSha256Hex_NormalizesInput(t *testing.T) {
	raw := "  Donor@Example.COM  "
	want := sha256Hex(strings.ToLower(strings.TrimSpace(raw)))
	if got := sha256Hex(raw); got != want {
		t.Errorf("sha256Hex did not normalize: got %q, want %q", got, want)
	}
}

// normalizePhoneE164 converts Indonesian local numbers to +62 form (Meta/TikTok expect E.164).
func TestNormalizePhoneE164(t *testing.T) {
	cases := map[string]string{
		"081234567890":    "+6281234567890",
		"6281234567890":   "+6281234567890",
		"+6281234567890":  "+6281234567890",
		" 0812 3456 7890 ": "+6281234567890", // spaces stripped
		"0215551234":      "+62215551234",
		"":                "", // empty stays empty (donor with no phone)
	}
	for in, want := range cases {
		if got := normalizePhoneE164(in); got != want {
			t.Errorf("normalizePhoneE164(%q) = %q, want %q", in, got, want)
		}
	}
}

// dedupEventID must be deterministic per invoice number so the platform can dedup
// webhook retries.
func TestDedupEventID(t *testing.T) {
	if got := dedupEventID("INV-ABCD1234"); got != "INV-ABCD1234" {
		t.Errorf("dedupEventID = %q, want INV-ABCD1234", got)
	}
	if dedupEventID("INV-A") == dedupEventID("INV-B") {
		t.Error("dedupEventID must differ for different invoices")
	}
}
