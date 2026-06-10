package jwt

import (
	"testing"
	"time"

	gojwt "github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

const testSecret = "test-secret-at-least-32-bytes-long-xx"

func TestGenerateParse_RoundTrip(t *testing.T) {
	uid := uuid.New()
	tok, err := GenerateAccessToken(uid, "a@b.co", "admin", testSecret, time.Hour)
	if err != nil {
		t.Fatalf("generate: %v", err)
	}
	claims, err := ParseToken(tok, testSecret)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	if claims.UserID != uid || claims.Email != "a@b.co" || claims.Role != "admin" {
		t.Errorf("claims mismatch: %+v", claims)
	}
	if claims.ID == "" {
		t.Error("expected non-empty JTI (ID) for revocation support")
	}
}

func TestGenerate_UniqueJTIPerToken(t *testing.T) {
	uid := uuid.New()
	a, _ := GenerateAccessToken(uid, "a@b.co", "admin", testSecret, time.Hour)
	b, _ := GenerateAccessToken(uid, "a@b.co", "admin", testSecret, time.Hour)
	ca, _ := ParseToken(a, testSecret)
	cb, _ := ParseToken(b, testSecret)
	if ca.ID == cb.ID {
		t.Errorf("two tokens share JTI %q — revoking one would revoke both", ca.ID)
	}
}

func TestParse_RejectsWrongSecret(t *testing.T) {
	tok, _ := GenerateAccessToken(uuid.New(), "a@b.co", "user", testSecret, time.Hour)
	if _, err := ParseToken(tok, "a-different-secret-32-bytes-xxxxxxxx"); err == nil {
		t.Error("expected error parsing token signed with a different secret")
	}
}

func TestParse_RejectsExpired(t *testing.T) {
	tok, _ := GenerateAccessToken(uuid.New(), "a@b.co", "user", testSecret, -time.Hour)
	if _, err := ParseToken(tok, testSecret); err == nil {
		t.Error("expected error parsing an expired token")
	}
}

// Alg-confusion guard: a token using a non-HMAC alg (e.g. "none") must be rejected,
// not silently accepted, since ParseToken pins the signing method to HMAC.
func TestParse_RejectsNoneAlg(t *testing.T) {
	claims := &Claims{
		RegisteredClaims: gojwt.RegisteredClaims{
			ExpiresAt: gojwt.NewNumericDate(time.Now().Add(time.Hour)),
			Subject:   uuid.New().String(),
		},
		Role: "admin",
	}
	unsigned := gojwt.NewWithClaims(gojwt.SigningMethodNone, claims)
	raw, err := unsigned.SignedString(gojwt.UnsafeAllowNoneSignatureType)
	if err != nil {
		t.Fatalf("build none-token: %v", err)
	}
	if _, err := ParseToken(raw, testSecret); err == nil {
		t.Error("expected ParseToken to reject alg=none token (alg-confusion attack)")
	}
}
