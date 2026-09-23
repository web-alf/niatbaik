// Package username normalizes, validates, and generates the public referral handle
// (?ref=<username>). Rules: lowercase, [a-z0-9_], 3..30 chars, not reserved.
package username

import (
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"
	"regexp"
	"strings"
)

var (
	validRe     = regexp.MustCompile(`^[a-z0-9_]{3,30}$`)
	stripRe     = regexp.MustCompile(`[^a-z0-9_]+`)
	reserved    = map[string]bool{"admin": true, "api": true, "me": true, "null": true, "root": true, "system": true, "niatbaik": true}
	ErrFormat   = errors.New("username hanya boleh berisi huruf kecil, angka, dan garis bawah (3–30 karakter)")
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

// codeAlphabet is a Crockford-style base32 set (lowercase, digits 2-9; no 0/1/i/l/o) —
// avoids visually-ambiguous characters in short codes shared over links/chat.
const codeAlphabet = "23456789abcdefghjkmnpqrstuvwxyz"

// GenerateRandomCode returns a unique 8-character random code from codeAlphabet, unrelated
// to any seed (email, name, ...). Used for referral handles where a private, non-guessable
// code is preferred over one derived from a public value. Always satisfies Validate.
func GenerateRandomCode(checkExists func(string) bool) string {
	for {
		buf := make([]byte, 8)
		for i := range buf {
			n, _ := rand.Int(rand.Reader, big.NewInt(int64(len(codeAlphabet))))
			buf[i] = codeAlphabet[n.Int64()]
		}
		candidate := string(buf)
		if !reserved[candidate] && !checkExists(candidate) {
			return candidate
		}
	}
}
