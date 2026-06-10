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

func TestHash_SaltedUnique(t *testing.T) {
	a, _ := HashPassword("samepass")
	b, _ := HashPassword("samepass")
	if a == b {
		t.Error("identical passwords produced identical hashes — salt missing")
	}
}
