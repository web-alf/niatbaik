package handler

import "testing"

func TestParseUpdateDate(t *testing.T) {
	ok := []string{"2026-10-31", "2026-10-31T09:30", "2026-10-31T09:30:00Z", "2026-10-31T09:30:00+07:00"}
	for _, s := range ok {
		if parseUpdateDate(s).IsZero() {
			t.Errorf("parseUpdateDate(%q) should parse", s)
		}
	}
	for _, s := range []string{"", "  ", "31/10/2026", "abc"} {
		if !parseUpdateDate(s).IsZero() {
			t.Errorf("parseUpdateDate(%q) should be zero", s)
		}
	}
}
