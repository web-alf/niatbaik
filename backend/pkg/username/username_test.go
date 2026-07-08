package username

import "testing"

func TestNormalizeValidate(t *testing.T) {
	cases := []struct {
		in      string
		norm    string
		wantErr bool
	}{
		{"Budi Santoso", "budisantoso", false},
		{"  UPPER_case ", "upper_case", false},
		{"budi@mail.com", "budimailcom", false},
		{"ab", "ab", true},        // too short
		{"admin", "admin", true},  // reserved
		{"a!!", "a", true},        // strips to 1 char → too short
	}
	for _, c := range cases {
		got := Normalize(c.in)
		if got != c.norm {
			t.Fatalf("Normalize(%q)=%q want %q", c.in, got, c.norm)
		}
		err := Validate(got)
		if (err != nil) != c.wantErr {
			t.Fatalf("Validate(%q) err=%v wantErr=%v", got, err, c.wantErr)
		}
	}
}

func TestGenerateUnique(t *testing.T) {
	taken := map[string]bool{"budi": true, "budi2": true}
	got := GenerateUnique("budi@mail.com", func(c string) bool { return taken[c] })
	if got == "budi" || got == "budi2" || taken[got] {
		t.Fatalf("GenerateUnique returned taken value %q", got)
	}
	if err := Validate(got); err != nil {
		t.Fatalf("GenerateUnique produced invalid username %q: %v", got, err)
	}
	// Short seed must be padded to satisfy the 3-char minimum.
	short := GenerateUnique("a", func(string) bool { return false })
	if err := Validate(short); err != nil {
		t.Fatalf("short seed produced invalid username %q: %v", short, err)
	}
}
