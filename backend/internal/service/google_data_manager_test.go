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

func TestDataManagerOAuthAndIngestUsesOfficialSchema(t *testing.T) {
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
			_ = json.NewEncoder(w).Encode(map[string]any{"access_token": "access", "expires_in": 3600})
		case "/v1/events:ingest":
			ingestSeen = true
			var body struct {
				Destinations []map[string]any `json:"destinations"`
				Events       []map[string]any `json:"events"`
			}
			if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
				t.Fatal(err)
			}
			d := body.Destinations[0]
			if _, exists := d["linkedAccount"]; exists {
				t.Fatal("linkedAccount must be absent")
			}
			for key, id := range map[string]string{"loginAccount": "2222222222", "operatingAccount": "1111111111"} {
				account := d[key].(map[string]any)
				if account["accountType"] != "GOOGLE_ADS" || account["accountId"] != id {
					t.Fatalf("%s=%#v", key, account)
				}
			}
			if d["productDestinationId"] != "333" {
				t.Fatalf("destination=%#v", d)
			}
			e := body.Events[0]
			if e["conversionValue"] != float64(125000) || e["currency"] != "IDR" {
				t.Fatalf("event=%#v", e)
			}
			if _, exists := e["currencyCode"]; exists {
				t.Fatal("currencyCode must be absent")
			}
			ids := e["adIdentifiers"].(map[string]any)
			if ids["gclid"] != "click" {
				t.Fatalf("adIdentifiers=%#v", ids)
			}
			_ = json.NewEncoder(w).Encode(map[string]string{"requestId": "req-1"})
		default:
			http.NotFound(w, r)
		}
	}))
	defer s.Close()
	c := NewGoogleDataManagerClient(s.Client(), s.URL+"/token", s.URL, "client", "secret", "refresh")
	id, err := c.Ingest(context.Background(), GoogleAdsConversion{CustomerID: "1111111111", LoginCustomerID: "2222222222", ConversionActionID: "333", Timestamp: time.Date(2026, 7, 22, 1, 2, 3, 0, time.UTC), Value: 125000, Currency: "IDR", TransactionID: "INV-1", IdentifierKind: "gclid", IdentifierValue: "click"}, false)
	if err != nil || id != "req-1" || !tokenSeen || !ingestSeen {
		t.Fatalf("id=%q err=%v", id, err)
	}
}

func TestDataManagerValidateOnlyOmitsEmptyAdIdentifiers(t *testing.T) {
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/token" {
			_ = json.NewEncoder(w).Encode(map[string]any{"access_token": "access", "expires_in": 3600})
			return
		}
		var body struct {
			ValidateOnly bool             `json:"validateOnly"`
			Events       []map[string]any `json:"events"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			t.Fatal(err)
		}
		if !body.ValidateOnly {
			t.Fatal("validateOnly=false")
		}
		if _, exists := body.Events[0]["adIdentifiers"]; exists {
			t.Fatal("empty adIdentifiers must be omitted")
		}
		_ = json.NewEncoder(w).Encode(map[string]string{"requestId": "validation"})
	}))
	defer s.Close()
	c := NewGoogleDataManagerClient(s.Client(), s.URL+"/token", s.URL, "client", "secret", "refresh")
	_, err := c.Ingest(context.Background(), GoogleAdsConversion{CustomerID: "1111111111", ConversionActionID: "333", Timestamp: time.Now(), Value: 1, Currency: "IDR", TransactionID: "VALIDATE"}, true)
	if err != nil {
		t.Fatal(err)
	}
}

func TestDataManagerRetrieveOfficialStatus(t *testing.T) {
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/token" {
			_ = json.NewEncoder(w).Encode(map[string]any{"access_token": "access", "expires_in": 3600})
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]any{"requestStatusPerDestination": []any{map[string]any{"requestStatus": "FAILED", "errorInfo": map[string]any{"errorCounts": []any{map[string]any{"reason": "INVALID_GCLID", "count": "1"}}}}}})
	}))
	defer s.Close()
	c := NewGoogleDataManagerClient(s.Client(), s.URL+"/token", s.URL, "client", "secret", "refresh")
	st, err := c.RetrieveStatus(context.Background(), "req/one")
	if err != nil || st.State != "FAILED" || !strings.Contains(st.Summary, "INVALID_GCLID") {
		t.Fatalf("status=%+v err=%v", st, err)
	}
}

func TestDataManagerSafeErrors(t *testing.T) {
	bad := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusTooManyRequests)
		_, _ = w.Write([]byte("raw-click-id\nsecret-value"))
	}))
	defer bad.Close()
	c := NewGoogleDataManagerClient(bad.Client(), bad.URL, bad.URL, "client", "secret-value", "refresh-value")
	_, err := c.RetrieveStatus(context.Background(), "request-secret")
	de, ok := err.(*DispatchError)
	if !ok || !de.Retryable || strings.Contains(err.Error(), "raw-click-id") || strings.Contains(err.Error(), "secret-value") || strings.Contains(err.Error(), "request-secret") {
		t.Fatalf("unsafe/untyped error: %v", err)
	}
}
