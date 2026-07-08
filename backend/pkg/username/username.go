// Package username normalizes, validates, and generates the public referral handle
// (?ref=<username>). Rules: lowercase, [a-z0-9_], 3..30 chars, not reserved.
package username

import (
	"errors"
	"fmt"
	"regexp"
	"strings"
)

var (
	validRe   = regexp.MustCompile(`^[a-z0-9_]{3,30}$`)
	stripRe   = regexp.MustCompile(`[^a-z0-9_]+`)
	reserved  = map[string]bool{"admin": true, "api": true, "me": true, "null": true, "root": true, "system": true, "niatbaik": true}
	ErrFormat = errors.New("username hanya boleh berisi huruf kecil, angka, dan garis bawah (3–30 karakter)")
	ErrReserved = errors.New("username ini tidak tersedia")
)

// Normalize lowercases and strips disallowed characters. It does NOT enforce length —
// callers use Validate for that (so a too-short normalized value fails loudly rather
// than being silently padded).
func Normalize(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = stripRe.ReplaceAllString(s, "")
	if len(s) > 30 {
		s = s[:30]
	}
	return s
}

// Validate returns nil when s is a well-formed, non-reserved username. Validate assumes
// s is already the exact value to store (call Normalize first if the input is raw).
func Validate(s string) error {
	if !validRe.MatchString(s) {
		return ErrFormat
	}
	if reserved[s] {
		return ErrReserved
	}
	return nil
}

// GenerateUnique derives a valid, unique username from a seed (email local-part or name),
// appending a numeric suffix on collision. checkExists reports whether a candidate is
// already taken. The result always satisfies Validate.
func GenerateUnique(seed string, checkExists func(string) bool) string {
	base := Normalize(seed)
	// Pad short/empty seeds so the base clears the 3-char minimum.
	for len(base) < 3 {
		base += "0"
	}
	candidate := base
	for i := 2; reserved[candidate] || checkExists(candidate); i++ {
		suffix := fmt.Sprintf("%d", i)
		// Keep within 30 chars when appending the suffix.
		trim := base
		if len(trim)+len(suffix) > 30 {
			trim = trim[:30-len(suffix)]
		}
		candidate = trim + suffix
	}
	return candidate
}
