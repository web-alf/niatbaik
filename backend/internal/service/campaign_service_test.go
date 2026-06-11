package service

import "testing"

func TestSanitizeImageRef(t *testing.T) {
	cases := map[string]string{
		"":                       "",
		"abc.png":                "abc.png",
		"/uploads/uuid.png":      "uuid.png", // strips the serving prefix
		"uploads/uuid.jpg":       "uuid.jpg",
		"../../etc/passwd":       "passwd",   // traversal collapsed
		"../../../etc/shadow":    "shadow",
		"foo/bar/baz.webp":       "baz.webp", // only the final element survives
		"https://evil.com/x.png": "",         // absolute URLs rejected
		"  spaced.png  ":         "spaced.png",
	}
	for in, want := range cases {
		if got := sanitizeImageRef(in); got != want {
			t.Errorf("sanitizeImageRef(%q) = %q, want %q", in, got, want)
		}
	}
}

// A sanitized image ref must never contain a path separator or traversal token,
// so it can be safely concatenated into /uploads/<name> for serving.
func TestSanitizeImageRef_NeverEscapesUploads(t *testing.T) {
	evil := []string{"../../x", "a/b/c", "....//x", "/abs/path", "x/../../../y"}
	for _, in := range evil {
		got := sanitizeImageRef(in)
		for _, bad := range []string{"/", "..", "\\"} {
			if got != "" && containsToken(got, bad) {
				t.Errorf("sanitizeImageRef(%q) = %q still contains %q", in, got, bad)
			}
		}
	}
}

func containsToken(s, tok string) bool {
	return len(tok) > 0 && indexOf(s, tok) >= 0
}

func indexOf(s, sub string) int {
	for i := 0; i+len(sub) <= len(s); i++ {
		if s[i:i+len(sub)] == sub {
			return i
		}
	}
	return -1
}
