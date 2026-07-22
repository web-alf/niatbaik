package service

import (
	"context"
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

type GoogleDataManagerClient struct {
	http                                                    *http.Client
	tokenURL, apiBase, clientID, clientSecret, refreshToken string
	mu                                                      sync.Mutex
	accessToken                                             string
	tokenExpiry                                             time.Time
}

func NewGoogleDataManagerClient(h *http.Client, tokenURL, apiBase, clientID, clientSecret, refreshToken string) *GoogleDataManagerClient {
	if h == nil {
		h = http.DefaultClient
	}
	return &GoogleDataManagerClient{http: h, tokenURL: tokenURL, apiBase: strings.TrimRight(apiBase, "/"), clientID: clientID, clientSecret: clientSecret, refreshToken: refreshToken}
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

func (c *GoogleDataManagerClient) do(ctx context.Context, method, endpoint string, body io.Reader, out any) error {
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
		return dispatchError("upstream_rejected", resp.StatusCode == 429 || resp.StatusCode >= 500, resp.StatusCode)
	}
	if err := json.NewDecoder(io.LimitReader(resp.Body, maxDataManagerResponse)).Decode(out); err != nil {
		return dispatchError("malformed_response", false, 0)
	}
	return nil
}

func (c *GoogleDataManagerClient) Ingest(ctx context.Context, conversion GoogleAdsConversion, validateOnly bool) (string, error) {
	identifier := map[string]string{conversion.IdentifierKind: conversion.IdentifierValue}
	if conversion.IdentifierKind == "" {
		identifier = map[string]string{}
	}
	payload := map[string]any{
		"destinations": []any{map[string]any{"linkedAccount": map[string]string{"loginAccount": "customers/" + conversion.LoginCustomerID, "operatingAccount": "customers/" + conversion.CustomerID}, "productDestinationId": conversion.ConversionActionID}},
		"events":       []any{map[string]any{"eventTimestamp": conversion.Timestamp.UTC().Format(time.RFC3339), "transactionId": conversion.TransactionID, "conversionValue": map[string]any{"value": conversion.Value, "currencyCode": conversion.Currency}, "adIdentifiers": []any{identifier}}},
		"validateOnly": validateOnly,
	}
	b, err := json.Marshal(payload)
	if err != nil {
		return "", dispatchError("payload", false, 0)
	}
	var out struct {
		RequestID string `json:"requestId"`
	}
	if err := c.do(ctx, http.MethodPost, c.apiBase+"/v1/events:ingest", strings.NewReader(string(b)), &out); err != nil {
		return "", err
	}
	if out.RequestID == "" {
		return "", dispatchError("malformed_response", false, 0)
	}
	return out.RequestID, nil
}

func (c *GoogleDataManagerClient) RetrieveStatus(ctx context.Context, requestID string) (DataManagerRequestStatus, error) {
	var out struct {
		State   string `json:"state"`
		Summary string `json:"summary"`
		Result  struct {
			Message string `json:"message"`
		} `json:"result"`
	}
	endpoint := c.apiBase + "/v1/requestStatus:retrieve?requestId=" + url.QueryEscape(requestID)
	if err := c.do(ctx, http.MethodGet, endpoint, nil, &out); err != nil {
		return DataManagerRequestStatus{}, err
	}
	if out.Summary == "" {
		out.Summary = out.Result.Message
	}
	return DataManagerRequestStatus{State: out.State, Summary: safeSummary(out.Summary)}, nil
}
