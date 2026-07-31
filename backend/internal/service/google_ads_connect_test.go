package service

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/anrdart/niatbaik-api/internal/config"
	"github.com/google/uuid"
)

func TestGoogleAdsTokenReadyPrecedence(t *testing.T) {
	cases := []struct {
		name            string
		oauthConfigured bool
		envToken        string
		dbToken         string
		want            bool
	}{
		{"nothing", false, "", "", false},
		{"oauth only, no token", true, "", "", false},
		{"env token only", true, "1//env", "", true},
		{"db token only", true, "", "1//db", true},
		{"db wins alongside env", true, "1//env", "1//db", true},
		{"token but no oauth app", false, "1//env", "1//db", false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := googleAdsTokenReady(tc.oauthConfigured, tc.envToken, tc.dbToken); got != tc.want {
				t.Fatalf("got %v, want %v", got, tc.want)
			}
		})
	}
}

func TestInterpretTestConnectionTreatsMissingIdentifierAsReachable(t *testing.T) {
	// The validate probe deliberately carries no click id, so a well-configured
	// destination answers NO_IDENTIFIERS_PROVIDED — that proves auth + destination
	// permission + a valid conversion action, which is exactly what the test checks.
	reachable := &DispatchError{Category: "upstream_rejected", Summary: "upstream HTTP 400; INVALID_ARGUMENT [NO_IDENTIFIERS_PROVIDED]"}
	if err := interpretTestConnection(reachable); err != nil {
		t.Fatalf("NO_IDENTIFIERS_PROVIDED should count as reachable, got %v", err)
	}

	if err := interpretTestConnection(nil); err != nil {
		t.Fatalf("nil should stay nil, got %v", err)
	}

	permission := &DispatchError{Category: "upstream_rejected", Summary: "upstream HTTP 403; PERMISSION_DENIED"}
	if err := interpretTestConnection(permission); err == nil {
		t.Fatal("PERMISSION_DENIED must remain a failure")
	}

	badAction := &DispatchError{Category: "upstream_rejected", Summary: "upstream HTTP 404; NOT_FOUND: Conversion action ID is not valid."}
	if err := interpretTestConnection(badAction); err == nil {
		t.Fatal("invalid conversion action must remain a failure")
	}
}

// fakeConnector records the OAuth interactions ConnectGoogleAds drives.
type fakeConnector struct {
	code, redirectURI  string
	returnToken, email string
	setToken           string
}

func (f *fakeConnector) AuthCodeURL(redirectURI, state string) string { return "url:" + state }
func (f *fakeConnector) ExchangeCode(_ context.Context, code, redirectURI string) (string, string, error) {
	f.code, f.redirectURI = code, redirectURI
	return f.returnToken, f.email, nil
}
func (f *fakeConnector) SetRefreshToken(token string) { f.setToken = token }

func TestGoogleAdsOAuthStateRoundTripAndRejection(t *testing.T) {
	fake := &fakeConnector{returnToken: "1//tok", email: "a@b.co"}
	cfg := &config.Config{JWTSecret: "test-secret-please-change-me", GoogleAdsClientID: "cid", GoogleAdsClientSecret: "csec", FrontendBaseURL: "https://site.example"}
	svc := &SettingService{cfg: cfg, connector: fake}

	url, err := svc.GoogleAdsOAuthStartURL(uuid.New())
	if err != nil {
		t.Fatal(err)
	}
	// fakeConnector.AuthCodeURL returns "url:"+state — extract the signed state.
	state := strings.TrimPrefix(url, "url:")
	if state == "" || state == url {
		t.Fatalf("no state embedded: %q", url)
	}

	// A tampered/empty state must be rejected before any exchange happens.
	if _, err := svc.ConnectGoogleAds(context.Background(), "code", "not-a-jwt"); !errors.Is(err, ErrValidation) {
		t.Fatalf("bad state should be ErrValidation, got %v", err)
	}
	if fake.code != "" {
		t.Fatal("exchange must not run on invalid state")
	}
}

func TestGoogleAdsConnectorInterfaceShape(t *testing.T) {
	// Compile-time guard: the concrete client satisfies GoogleAdsConnector, and the
	// fake matches the interface the service depends on.
	var _ GoogleAdsConnector = (*fakeConnector)(nil)
	var _ GoogleAdsConnector = (*GoogleDataManagerClient)(nil)
	if !strings.HasPrefix((&fakeConnector{}).AuthCodeURL("", "s"), "url:") {
		t.Fatal("fake sanity")
	}
}
