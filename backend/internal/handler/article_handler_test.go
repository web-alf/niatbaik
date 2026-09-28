package handler

import (
	"strings"
	"testing"

	"github.com/google/uuid"
)

func ptr(s string) *string { return &s }

func TestArticleInputValidate(t *testing.T) {
	long := strings.Repeat("a", 256)
	longExcerpt := strings.Repeat("a", 501)

	cases := []struct {
		name        string
		in          articleInput
		requireBody bool
		wantOK      bool
	}{
		{"create ok", articleInput{Title: "Judul", Content: "Isi"}, true, true},
		{"create missing title", articleInput{Content: "Isi"}, true, false},
		{"create missing content", articleInput{Title: "Judul"}, true, false},
		{"create blank-only title", articleInput{Title: "   ", Content: "Isi"}, true, false},
		{"title too long", articleInput{Title: long, Content: "Isi"}, true, false},
		{"excerpt too long", articleInput{Title: "Judul", Content: "Isi", Excerpt: ptr(longExcerpt)}, true, false},
		{"bad status", articleInput{Title: "Judul", Content: "Isi", Status: "Arsip"}, true, false},
		{"published status ok", articleInput{Title: "Judul", Content: "Isi", Status: "Published"}, true, true},
		// Update path: a status-only toggle must pass without resending title/content.
		{"update partial ok", articleInput{Status: "Published"}, false, true},
		{"update empty ok", articleInput{}, false, true},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			in := tc.in
			msg, ok := in.validate(tc.requireBody)
			if ok != tc.wantOK {
				t.Fatalf("validate() ok = %v, want %v (msg=%q)", ok, tc.wantOK, msg)
			}
			if !ok && msg == "" {
				t.Fatal("validate() rejected without a message")
			}
		})
	}
}

func TestArticleInputValidateTrims(t *testing.T) {
	in := articleInput{Title: "  Judul  ", Content: "  Isi  ", Excerpt: ptr("  Ringkas  ")}
	if _, ok := in.validate(true); !ok {
		t.Fatal("expected valid")
	}
	if in.Title != "Judul" || in.Content != "Isi" || *in.Excerpt != "Ringkas" {
		t.Fatalf("fields not trimmed: %q / %q / %q", in.Title, in.Content, *in.Excerpt)
	}
}

func TestParseCategory(t *testing.T) {
	id := uuid.New()

	if got, ok := parseCategory(""); !ok || got != nil {
		t.Fatalf("empty should be a valid nil category, got (%v, %v)", got, ok)
	}
	if got, ok := parseCategory("   "); !ok || got != nil {
		t.Fatalf("blank should be a valid nil category, got (%v, %v)", got, ok)
	}
	if _, ok := parseCategory("not-a-uuid"); ok {
		t.Fatal("malformed uuid should be rejected, not silently dropped")
	}
	got, ok := parseCategory(id.String())
	if !ok || got == nil || *got != id {
		t.Fatalf("valid uuid not parsed, got (%v, %v)", got, ok)
	}
}

func TestDeref(t *testing.T) {
	if deref(nil) != "" {
		t.Fatal("nil should deref to empty string")
	}
	if deref(ptr("x")) != "x" {
		t.Fatal("pointer should deref to its value")
	}
}
