package pagination

import "testing"

func TestSanitizeSort_AllowsWhitelistedColumns(t *testing.T) {
	cases := map[string]string{
		"created_at desc":     "created_at desc",
		"created_at asc":      "created_at asc",
		"title ASC":           "title asc", // direction case-insensitive
		"TOTAL DESC":          "total desc", // column case-insensitive
		"  paid_at   desc  ":  "paid_at desc", // trimmed + collapsed
		"name":                "name asc",      // bare column defaults to asc
		"invoice_number desc": "invoice_number desc",
	}
	for in, want := range cases {
		if got := SanitizeSort(in); got != want {
			t.Errorf("SanitizeSort(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestSanitizeSort_RejectsInjectionAndUnknown(t *testing.T) {
	// Every one of these must fall back to the safe default, never reach SQL.
	bad := []string{
		"created_at; DROP TABLE users",
		"created_at desc; DELETE FROM invoices",
		"(SELECT * FROM users)",
		"id) UNION SELECT password FROM users--",
		"password",                 // not whitelisted
		"created_at desc, name asc", // multi-field (comma) not allowed
		"created_at sideways",       // bad direction
		"created_at desc extra",     // too many fields
		"1=1",
		"",
		"   ",
	}
	for _, in := range bad {
		if got := SanitizeSort(in); got != DefaultSort {
			t.Errorf("SanitizeSort(%q) = %q, want default %q", in, got, DefaultSort)
		}
	}
}

func TestSanitizeSort_DefaultConstantIsWhitelisted(t *testing.T) {
	// The default itself must survive a round-trip through the sanitizer.
	if got := SanitizeSort(DefaultSort); got != DefaultSort {
		t.Errorf("default %q not stable through SanitizeSort: got %q", DefaultSort, got)
	}
}
