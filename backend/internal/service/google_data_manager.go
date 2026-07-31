package service

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"
	"unicode"
)

const maxDataManagerResponse = 1 << 20

type GoogleAdsConversion struct {
	CustomerID, LoginCustomerID, ConversionActionID string
	Timestamp                                       time.Time
	Value                                           int64
	Currency, TransactionID                         string
	IdentifierKind, IdentifierValue                 string
	EventSource                                     string
}

type DataManagerRequestStatus struct{ State, Summary string }

type DataManagerClient interface {
	Ingest(context.Context, GoogleAdsConversion, bool) (string, error)
	RetrieveStatus(context.Context, string) (DataManagerRequestStatus, error)
}

type DispatchError struct {
	Category  string
	Retryable bool
	Summary   string
}

func (e *DispatchError) Error() string { return e.Category + ": " + e.Summary }

func SafeGoogleAdsSummary(s string) string { return safeSummary(s) }

func safeSummary(s string) string {
	r := []rune(strings.Map(func(r rune) rune {
		if unicode.IsControl(r) {
			return ' '
		}
		return r
	}, strings.TrimSpace(s)))
	if len(r) > 1000 {
		r = r[:1000]
	}
	return string(r)
}

func dispatchError(category string, retryable bool, status int) error {
	summary := category
	if status != 0 {
		summary = fmt.Sprintf("upstream HTTP %d", status)
	}
	return &DispatchError{Category: category, Retryable: retryable, Summary: safeSummary(summary)}
}

// isSafeEnum reports whether s looks like a Google error enum (UPPER_SNAKE, bounded),
// so it can be echoed to operators without risk of leaking free-form/PII content.
func isSafeEnum(s string) bool {
	return s != "" && len(s) <= 64 && strings.Trim(s, "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_") == ""
}

func upstreamError(resp *http.Response, sensitive ...string) error {
	retryable := resp.StatusCode == http.StatusTooManyRequests || resp.StatusCode >= 500
	summary := fmt.Sprintf("upstream HTTP %d", resp.StatusCode)
	var envelope struct {
		Error struct {
			Status  string `json:"status"`
			Message string `json:"message"`
			Details []struct {
				Type            string `json:"@type"`
				Reason          string `json:"reason"`
				FieldViolations []struct {
					Field  string `json:"field"`
					Reason string `json:"reason"`
				} `json:"fieldViolations"`
			} `json:"details"`
		} `json:"error"`
	}
	if err := json.NewDecoder(io.LimitReader(resp.Body, maxDataManagerResponse)).Decode(&envelope); err == nil && envelope.Error.Status != "" {
		status := envelope.Error.Status
		if isSafeEnum(status) {
			message := envelope.Error.Message
			for _, value := range sensitive {
				if value != "" {
					message = strings.ReplaceAll(message, value, "[REDACTED]")
				}
			}
			summary += "; " + status
			if message != "" {
				summary += ": " + message
			}
			// Google buries the actionable cause in details[].reason (ErrorInfo) and
			// details[].fieldViolations[].reason (BadRequest). Surface those enums so a
			// generic INVALID_ARGUMENT/PERMISSION_DENIED becomes diagnosable.
			for _, detail := range envelope.Error.Details {
				if isSafeEnum(detail.Reason) && detail.Reason != status {
					summary += " [" + detail.Reason + "]"
				}
				for _, v := range detail.FieldViolations {
					if isSafeEnum(v.Reason) {
						summary += " [" + v.Reason + "]"
					}
				}
			}
		}
	}
	return &DispatchError{Category: "upstream_rejected", Retryable: retryable, Summary: safeSummary(summary)}
}

type GoogleDataManagerClient struct {
	http                                                             *http.Client
	tokenURL, apiBase, authURL, clientID, clientSecret, refreshToken string
	mu                                                               sync.Mutex
	accessToken                                                      string
	tokenExpiry                                                      time.Time
}

func NewGoogleDataManagerClient(h *http.Client, tokenURL, apiBase, clientID, clientSecret, refreshToken string) *GoogleDataManagerClient {
	if h == nil {
		h = http.DefaultClient
	}
	return &GoogleDataManagerClient{http: h, tokenURL: tokenURL, apiBase: strings.TrimRight(apiBase, "/"), clientID: clientID, clientSecret: clientSecret, refreshToken: refreshToken, authURL: "https://accounts.google.com/o/oauth2/v2/auth"}
}

// SetRefreshToken swaps the refresh token at runtime (used after the "Connect
// Google Ads" flow persists a new token) and clears the cached access token so
// the next call mints one from the new refresh token — no process restart.
func (c *GoogleDataManagerClient) SetRefreshToken(token string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.refreshToken = token
	c.accessToken = ""
	c.tokenExpiry = time.Time{}
}

// AuthCodeURL builds the Google consent-screen URL for the authorization-code
// flow. offline access + prompt=consent guarantees a refresh_token is returned.
func (c *GoogleDataManagerClient) AuthCodeURL(redirectURI, state string) string {
	q := url.Values{
		"client_id":     {c.clientID},
		"redirect_uri":  {redirectURI},
		"response_type": {"code"},
		"scope":         {"openid email https://www.googleapis.com/auth/datamanager"},
		"access_type":   {"offline"},
		"prompt":        {"consent"},
		"state":         {state},
	}
	return c.authURL + "?" + q.Encode()
}

// ExchangeCode swaps an authorization code for a refresh token and the email of
// the Google account that granted consent (decoded from the returned id_token).
func (c *GoogleDataManagerClient) ExchangeCode(ctx context.Context, code, redirectURI string) (refreshToken, email string, err error) {
	form := url.Values{
		"grant_type":    {"authorization_code"},
		"code":          {code},
		"client_id":     {c.clientID},
		"client_secret": {c.clientSecret},
		"redirect_uri":  {redirectURI},
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.tokenURL, strings.NewReader(form.Encode()))
	if err != nil {
		return "", "", dispatchError("oauth_request", false, 0)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := c.http.Do(req)
	if err != nil {
		return "", "", dispatchError("oauth_transport", true, 0)
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", "", dispatchError("oauth_rejected", resp.StatusCode == 429 || resp.StatusCode >= 500, resp.StatusCode)
	}
	var out struct {
		RefreshToken string `json:"refresh_token"`
		IDToken      string `json:"id_token"`
	}
	if err := json.NewDecoder(io.LimitReader(resp.Body, maxDataManagerResponse)).Decode(&out); err != nil || out.RefreshToken == "" {
		return "", "", dispatchError("oauth_response", false, 0)
	}
	return out.RefreshToken, emailFromIDToken(out.IDToken), nil
}

// emailFromIDToken decodes the unverified email claim from a Google id_token.
// The token came directly from Google's TLS token endpoint, so signature
// verification is unnecessary here; we only read the email for display.
func emailFromIDToken(idToken string) string {
	parts := strings.Split(idToken, ".")
	if len(parts) != 3 {
		return ""
	}
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return ""
	}
	var claims struct {
		Email string `json:"email"`
	}
	if err := json.Unmarshal(payload, &claims); err != nil {
		return ""
	}
	return claims.Email
}

func (c *GoogleDataManagerClient) token(ctx context.Context) (string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.accessToken != "" && time.Now().Before(c.tokenExpiry.Add(-time.Minute)) {
		return c.accessToken, nil
	}
	form := url.Values{"grant_type": {"refresh_token"}, "client_id": {c.clientID}, "client_secret": {c.clientSecret}, "refresh_token": {c.refreshToken}}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.tokenURL, strings.NewReader(form.Encode()))
	if err != nil {
		return "", dispatchError("oauth_request", false, 0)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := c.http.Do(req)
	if err != nil {
		return "", dispatchError("oauth_transport", true, 0)
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", dispatchError("oauth_rejected", resp.StatusCode == 429 || resp.StatusCode >= 500, resp.StatusCode)
	}
	var out struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   int    `json:"expires_in"`
	}
	if err := json.NewDecoder(io.LimitReader(resp.Body, maxDataManagerResponse)).Decode(&out); err != nil || out.AccessToken == "" {
		return "", dispatchError("oauth_response", false, 0)
	}
	c.accessToken, c.tokenExpiry = out.AccessToken, time.Now().Add(time.Duration(out.ExpiresIn)*time.Second)
	return c.accessToken, nil
}

func (c *GoogleDataManagerClient) do(ctx context.Context, method, endpoint string, body io.Reader, out any, sensitive ...string) error {
	token, err := c.token(ctx)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, method, endpoint, body)
	if err != nil {
		return dispatchError("request", false, 0)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return dispatchError("transport", true, 0)
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return upstreamError(resp, append([]string{token, c.clientID, c.clientSecret, c.refreshToken}, sensitive...)...)
	}
	if err := json.NewDecoder(io.LimitReader(resp.Body, maxDataManagerResponse)).Decode(out); err != nil {
		return dispatchError("malformed_response", false, 0)
	}
	return nil
}

func (c *GoogleDataManagerClient) Ingest(ctx context.Context, conversion GoogleAdsConversion, validateOnly bool) (string, error) {
	destination := map[string]any{
		"operatingAccount":     map[string]string{"accountType": "GOOGLE_ADS", "accountId": conversion.CustomerID},
		"productDestinationId": conversion.ConversionActionID,
	}
	if conversion.LoginCustomerID != "" {
		destination["loginAccount"] = map[string]string{"accountType": "GOOGLE_ADS", "accountId": conversion.LoginCustomerID}
	}
	event := map[string]any{
		"eventTimestamp":  conversion.Timestamp.UTC().Format(time.RFC3339),
		"transactionId":   conversion.TransactionID,
		"conversionValue": conversion.Value,
		"currency":        conversion.Currency,
	}
	if conversion.EventSource != "" {
		event["eventSource"] = conversion.EventSource
	}
	if conversion.IdentifierKind != "" && conversion.IdentifierValue != "" {
		event["adIdentifiers"] = map[string]string{conversion.IdentifierKind: conversion.IdentifierValue}
	}
	payload := map[string]any{
		"destinations": []any{destination},
		"events":       []any{event},
		"validateOnly": validateOnly,
	}
	b, err := json.Marshal(payload)
	if err != nil {
		return "", dispatchError("payload", false, 0)
	}
	var out struct {
		RequestID string `json:"requestId"`
	}
	if err := c.do(ctx, http.MethodPost, c.apiBase+"/v1/events:ingest", strings.NewReader(string(b)), &out,
		conversion.CustomerID, conversion.LoginCustomerID, conversion.ConversionActionID,
		conversion.TransactionID, conversion.IdentifierValue); err != nil {
		return "", err
	}
	if out.RequestID == "" {
		return "", dispatchError("malformed_response", false, 0)
	}
	return out.RequestID, nil
}

func (c *GoogleDataManagerClient) RetrieveStatus(ctx context.Context, requestID string) (DataManagerRequestStatus, error) {
	var out struct {
		Statuses []struct {
			State     string `json:"requestStatus"`
			ErrorInfo struct {
				Counts []struct {
					Reason string `json:"reason"`
					Count  string `json:"count"`
				} `json:"errorCounts"`
			} `json:"errorInfo"`
			WarningInfo struct {
				Counts []struct {
					Reason string `json:"reason"`
					Count  string `json:"count"`
				} `json:"warningCounts"`
			} `json:"warningInfo"`
		} `json:"requestStatusPerDestination"`
	}
	endpoint := c.apiBase + "/v1/requestStatus:retrieve?requestId=" + url.QueryEscape(requestID)
	if err := c.do(ctx, http.MethodGet, endpoint, nil, &out, requestID); err != nil {
		return DataManagerRequestStatus{}, err
	}
	if len(out.Statuses) != 1 || out.Statuses[0].State == "" {
		return DataManagerRequestStatus{}, dispatchError("malformed_response", false, 0)
	}
	status := out.Statuses[0]
	parts := make([]string, 0, len(status.ErrorInfo.Counts)+len(status.WarningInfo.Counts))
	for _, count := range append(status.ErrorInfo.Counts, status.WarningInfo.Counts...) {
		parts = append(parts, count.Reason+"="+count.Count)
	}
	return DataManagerRequestStatus{State: status.State, Summary: safeSummary(strings.Join(parts, ", "))}, nil
}
