package service

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestDataManagerOAuthAndIngest(t *testing.T) {
	var tokenSeen, ingestSeen bool
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/token":
			tokenSeen = true
			if err := r.ParseForm(); err != nil {
				t.Fatal(err)
			}
			if r.Form.Get("grant_type") != "refresh_token" || r.Form.Get("client_id") != "client" || r.Form.Get("client_secret") != "secret" || r.Form.Get("refresh_token") != "refresh" {
				t.Fatalf("bad oauth form: %#v", r.Form)
			}
			json.NewEncoder(w).Encode(map[string]any{"access_token": "access", "expires_in": 3600, "token_type": "Bearer"})
		case "/v1/events:ingest":
			ingestSeen = true
			if r.Header.Get("Authorization") != "Bearer access" {
				t.Fatalf("authorization=%q", r.Header.Get("Authorization"))
			}
			if r.Header.Get("developer-token") != "" || r.Header.Get("login-customer-id") != "" {
				t.Fatal("legacy ads headers present")
			}
			var body map[string]any
			if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
				t.Fatal(err)
			}
			b, _ := json.Marshal(body)
			got := string(b)
			for _, want := range []string{`"loginAccount":"customers/2222222222"`, `"operatingAccount":"customers/1111111111"`, `"productDestinationId":"333"`, `"transactionId":"INV-1"`, `"currencyCode":"IDR"`, `"value":125000`, `"gclid":"click"`} {
				if !strings.Contains(got, want) {
					t.Errorf("payload missing %s: %s", want, got)
				}
			}
			json.NewEncoder(w).Encode(map[string]string{"requestId": "req-1"})
		default:
			http.NotFound(w, r)
		}
	}))
	defer s.Close()
	c := NewGoogleDataManagerClient(s.Client(), s.URL+"/token", s.URL, "client", "secret", "refresh")
	id, err := c.Ingest(context.Background(), GoogleAdsConversion{CustomerID: "1111111111", LoginCustomerID: "2222222222", ConversionActionID: "333", Timestamp: time.Date(2026, 7, 22, 1, 2, 3, 0, time.UTC), Value: 125000, Currency: "IDR", TransactionID: "INV-1", IdentifierKind: "gclid", IdentifierValue: "click"}, false)
	if err != nil || id != "req-1" || !tokenSeen || !ingestSeen {
		t.Fatalf("id=%q err=%v token=%v ingest=%v", id, err, tokenSeen, ingestSeen)
	}
}

func TestDataManagerRetrieveStatusAndSafeErrors(t *testing.T) {
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/token" {
			json.NewEncoder(w).Encode(map[string]any{"access_token": "access", "expires_in": 3600})
			return
		}
		if r.URL.Query().Get("requestId") != "req/one" {
			t.Fatalf("request id=%q", r.URL.Query().Get("requestId"))
		}
		json.NewEncoder(w).Encode(map[string]any{"state": "SUCCESS", "result": map[string]string{"message": "accepted"}})
	}))
	defer s.Close()
	c := NewGoogleDataManagerClient(s.Client(), s.URL+"/token", s.URL, "client-secret-value", "secret-value", "refresh-value")
	st, err := c.RetrieveStatus(context.Background(), "req/one")
	if err != nil || st.State != "SUCCESS" {
		t.Fatalf("status=%+v err=%v", st, err)
	}

	bad := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusTooManyRequests)
		w.Write([]byte("raw-click-id\nsecret-value"))
	}))
	defer bad.Close()
	c = NewGoogleDataManagerClient(bad.Client(), bad.URL, bad.URL, "client-secret-value", "secret-value", "refresh-value")
	_, err = c.RetrieveStatus(context.Background(), "request-secret")
	de, ok := err.(*DispatchError)
	if !ok || !de.Retryable || strings.Contains(err.Error(), "raw-click-id") || strings.Contains(err.Error(), "secret-value") || strings.Contains(err.Error(), "request-secret") {
		t.Fatalf("unsafe/untyped error: %v", err)
	}
}
