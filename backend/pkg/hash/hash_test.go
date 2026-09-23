package hash

import "testing"

func TestHashCheck_RoundTrip(t *testing.T) {
	h, err := HashPassword("S3cret<>Pass")
	if err != nil {
		t.Fatalf("hash: %v", err)
	}
	if h == "S3cret<>Pass" {
		t.Error("password stored in plaintext")
	}
	if !CheckPassword("S3cret<>Pass", h) {
		t.Error("correct password rejected")
	}
	if CheckPassword("wrong", h) {
		t.Error("wrong password accepted")
	}
}

func TestGenerateRandomPassword(t *testing.T) {
	a, err := GenerateRandomPassword(12)
	if err != nil {
		t.Fatalf("generate: %v", err)
	}
	if len(a) != 12 {
		t.Errorf("expected length 12, got %d (%q)", len(a), a)
	}
	b, _ := GenerateRandomPassword(12)
	if a == b {
		t.Error("two calls produced identical passwords — not random")
	}
}

func TestHash_SaltedUnique(t *testing.T) {
	a, _ := HashPassword("samepass")
	b, _ := HashPassword("samepass")
	if a == b {
		t.Error("identical passwords produced identical hashes — salt missing")
	}
}
