package service

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"
)

func TestAuthCodeURLCarriesOfflineConsentAndScope(t *testing.T) {
	c := NewGoogleDataManagerClient(nil, "https://oauth2.googleapis.com/token", "https://datamanager.googleapis.com", "client-123", "secret", "")
	raw := c.AuthCodeURL("https://site.example/api/settings/google-ads/oauth/callback", "state-xyz")

	u, err := url.Parse(raw)
	if err != nil {
		t.Fatal(err)
	}
	q := u.Query()
	checks := map[string]string{
		"client_id":     "client-123",
		"redirect_uri":  "https://site.example/api/settings/google-ads/oauth/callback",
		"response_type": "code",
		"access_type":   "offline",
		"prompt":        "consent",
		"state":         "state-xyz",
	}
	for key, want := range checks {
		if got := q.Get(key); got != want {
			t.Fatalf("%s = %q, want %q", key, got, want)
		}
	}
	if !strings.Contains(q.Get("scope"), "https://www.googleapis.com/auth/datamanager") {
		t.Fatalf("scope missing datamanager: %q", q.Get("scope"))
	}
}

func TestExchangeCodeReturnsRefreshTokenAndEmail(t *testing.T) {
	idToken := "h." + base64.RawURLEncoding.EncodeToString([]byte(`{"email":"ads@example.org"}`)) + ".sig"
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if err := r.ParseForm(); err != nil {
			t.Fatal(err)
		}
		if r.Form.Get("grant_type") != "authorization_code" ||
			r.Form.Get("code") != "the-code" ||
			r.Form.Get("redirect_uri") != "https://site.example/cb" ||
			r.Form.Get("client_id") != "client" ||
			r.Form.Get("client_secret") != "secret" {
			t.Fatalf("bad exchange form: %#v", r.Form)
		}
		_ = json.NewEncoder(w).Encode(map[string]any{"refresh_token": "1//refresh", "id_token": idToken})
	}))
	defer s.Close()

	c := NewGoogleDataManagerClient(s.Client(), s.URL, s.URL, "client", "secret", "")
	token, email, err := c.ExchangeCode(context.Background(), "the-code", "https://site.example/cb")
	if err != nil || token != "1//refresh" || email != "ads@example.org" {
		t.Fatalf("token=%q email=%q err=%v", token, email, err)
	}
}

func TestExchangeCodeRejectsResponseWithoutRefreshToken(t *testing.T) {
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{"access_token": "a", "id_token": "x.y.z"})
	}))
	defer s.Close()
	c := NewGoogleDataManagerClient(s.Client(), s.URL, s.URL, "client", "secret", "")
	if _, _, err := c.ExchangeCode(context.Background(), "code", "https://site.example/cb"); err == nil {
		t.Fatal("want error when refresh_token absent")
	}
}

func TestSetRefreshTokenReplacesTokenAndClearsCache(t *testing.T) {
	var minted []string
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = r.ParseForm()
		minted = append(minted, r.Form.Get("refresh_token"))
		_ = json.NewEncoder(w).Encode(map[string]any{"access_token": "access-" + r.Form.Get("refresh_token"), "expires_in": 3600})
	}))
	defer s.Close()

	c := NewGoogleDataManagerClient(s.Client(), s.URL, s.URL, "client", "secret", "old-token")
	if _, err := c.token(context.Background()); err != nil {
		t.Fatal(err)
	}
	c.SetRefreshToken("new-token")
	// After swap, the cached access token must be discarded and a fresh mint must
	// use the new refresh token.
	if _, err := c.token(context.Background()); err != nil {
		t.Fatal(err)
	}
	if len(minted) != 2 || minted[0] != "old-token" || minted[1] != "new-token" {
		t.Fatalf("minted = %#v", minted)
	}
}

func TestUpstreamErrorSurfacesDetailReasons(t *testing.T) {
	bad := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/token" {
			_ = json.NewEncoder(w).Encode(map[string]any{"access_token": "access", "expires_in": 3600})
			return
		}
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]any{"error": map[string]any{
			"code": 400, "status": "INVALID_ARGUMENT", "message": "There was a problem with the request.",
			"details": []any{
				map[string]any{"@type": "type.googleapis.com/google.rpc.ErrorInfo", "reason": "INVALID_ARGUMENT"},
				map[string]any{"@type": "type.googleapis.com/google.rpc.BadRequest", "fieldViolations": []any{
					map[string]any{"field": "events.events[0]", "reason": "NO_IDENTIFIERS_PROVIDED"},
				}},
			},
		}})
	}))
	defer bad.Close()

	c := NewGoogleDataManagerClient(bad.Client(), bad.URL+"/token", bad.URL, "client", "secret", "refresh")
	_, err := c.Ingest(context.Background(), GoogleAdsConversion{CustomerID: "1", ConversionActionID: "2", Timestamp: time.Now(), Value: 1, Currency: "IDR", TransactionID: "T"}, true)
	de, ok := err.(*DispatchError)
	if !ok || !strings.Contains(de.Summary, "INVALID_ARGUMENT") || !strings.Contains(de.Summary, "NO_IDENTIFIERS_PROVIDED") {
		t.Fatalf("missing detail reason: %#v", err)
	}
}
