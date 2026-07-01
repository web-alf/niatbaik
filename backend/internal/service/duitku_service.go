package service

import (
	"bytes"
	"crypto/md5"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/anrdart/niatbaik-api/internal/config"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
)

// DuitkuService integrates Duitku's hosted Inquiry API (Payment Links). Same lifecycle
// as Flip/Xendit: create a transaction → store the paymentUrl on the invoice →
// redirect the donor → settle on the return-webhook callback. Duitku signs requests
// with md5(merchantCode + merchantOrderId + amount + apiKey); callbacks are verified
// with md5(merchantCode + amount + merchantOrderId + apiKey) using the callback key.
type DuitkuService struct {
	cfg           *config.Config
	paymentSvc    *PaymentService
	invoiceRepo   *repository.InvoiceRepo
	settingRepo   *repository.SettingRepo
	processedRepo *repository.ProcessedWebhookRepo
}

func NewDuitkuService(cfg *config.Config, paymentSvc *PaymentService, invoiceRepo *repository.InvoiceRepo, settingRepo *repository.SettingRepo, processedRepo *repository.ProcessedWebhookRepo) *DuitkuService {
	return &DuitkuService{cfg: cfg, paymentSvc: paymentSvc, invoiceRepo: invoiceRepo, settingRepo: settingRepo, processedRepo: processedRepo}
}

func (s *DuitkuService) getCredentials() (merchant, apiKey, callbackKey, baseURL string) {
	// POP createInvoice API hosts: sandbox vs production differ (unlike a single host).
	def := "https://api-prod.duitku.com"
	if setting, err := s.settingRepo.Get(); err == nil && setting != nil {
		baseURL = strings.TrimSpace(setting.DuitkuBaseURL)
		if baseURL == "" {
			if strings.EqualFold(strings.TrimSpace(setting.DuitkuMode), "sandbox") {
				baseURL = "https://api-sandbox.duitku.com"
			} else {
				baseURL = def
			}
		}
		return strings.TrimSpace(setting.DuitkuMerchant), strings.TrimSpace(setting.DuitkuAPIKey), strings.TrimSpace(setting.DuitkuCallbackKey), baseURL
	}
	return "", "", "", def
}

// DuitkuInquiryResponse is the subset of Duitku's create-transaction response we use.
type DuitkuInquiryResponse struct {
	PaymentURL   string `json:"paymentUrl"`
	Reference    string `json:"reference"`
	MerchantCode string `json:"merchantCode"`
	StatusCode   string `json:"statusCode"`
}

// DuitkuCallback is the return/notify callback Duitku POSTs (form or JSON depending on
// integration). resultCode "00" = success.
type DuitkuCallback struct {
	MerchantCode    string `json:"merchantCode"`
	Amount          string `json:"amount"`
	MerchantOrderID string `json:"merchantOrderId"`
	Reference       string `json:"reference"`
	ResultCode      string `json:"resultCode"`
	Message         string `json:"message"`
	Signature       string `json:"signature"`
}

// signCreate = md5(merchantCode + merchantOrderId + amount + apiKey).
func (s *DuitkuService) signCreate(merchant, orderID string, amount int64, apiKey string) string {
	h := md5.Sum([]byte(merchant + orderID + strconv.FormatInt(amount, 10) + apiKey))
	return hex.EncodeToString(h[:])
}

// signCallback = md5(merchantCode + amount + merchantOrderId + apiKey).
func (s *DuitkuService) signCallback(merchant, amount, orderID, apiKey string) string {
	h := md5.Sum([]byte(merchant + amount + orderID + apiKey))
	return hex.EncodeToString(h[:])
}

// CreatePayment creates a hosted Duitku transaction and returns the redirect URL.
func (s *DuitkuService) CreatePayment(invoice *model.Invoice, redirectURL string) (*DuitkuInquiryResponse, error) {
	merchant, apiKey, _, baseURL := s.getCredentials()
	if merchant == "" || apiKey == "" {
		return nil, fmt.Errorf("duitku not configured (merchant/api key missing)")
	}

	orderID := invoice.InvoiceNumber
	// POP createInvoice: no paymentMethod required (donor picks on the hosted page).
	// Request is authenticated by header signature (see below), not a body-hash field.
	body, err := json.Marshal(map[string]interface{}{
		"paymentAmount":   invoice.Total,
		"merchantOrderId": orderID,
		"productDetails":  "Donasi " + invoice.InvoiceNumber,
		"email":           nonEmpty(invoice.DonorEmail, "noreply+"+strings.ToLower(invoice.InvoiceNumber)+"@niatbaik.org"),
		"customerVaName":  invoice.DonorName,
		"phoneNumber":     invoice.DonorPhone,
		"callbackUrl":     webhookURL(redirectURL, "duitku"),
		"returnUrl":       redirectURL,
		"expiryPeriod":    1440, // minutes = 24h
	})
	if err != nil {
		return nil, err
	}

	// POP createInvoice header auth: sha256(merchantCode + timestamp_ms + apiKey).
	timestamp := strconv.FormatInt(time.Now().UnixMilli(), 10)
	sigRaw := sha256.Sum256([]byte(merchant + timestamp + apiKey))
	req, err := http.NewRequest("POST", baseURL+"/api/merchant/createInvoice", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("x-duitku-signature", hex.EncodeToString(sigRaw[:]))
	req.Header.Set("x-duitku-timestamp", timestamp)
	req.Header.Set("x-duitku-merchantcode", merchant)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("duitku API error %d: %s", resp.StatusCode, string(respBody))
	}

	var d DuitkuInquiryResponse
	if err := json.Unmarshal(respBody, &d); err != nil {
		return nil, err
	}
	if d.PaymentURL == "" {
		return nil, fmt.Errorf("duitku returned no payment URL: %s", string(respBody))
	}
	return &d, nil
}

// VerifySignature constant-time-compares the inbound callback Signature. Duitku's POP
// callback signs with md5(merchantCode + amount + merchantOrderId + API_KEY) — the
// merchant API key, per Duitku's official SDK — NOT a separate callback key. We accept
// a match against the API key first; if a distinct callback key is configured we also
// accept that (some setups differ), so the API key is the canonical secret.
func (s *DuitkuService) VerifySignature(cb DuitkuCallback) bool {
	merchant, apiKey, callbackKey, _ := s.getCredentials()
	if cb.Signature == "" {
		return false
	}
	for _, secret := range []string{apiKey, callbackKey} {
		if secret == "" {
			continue
		}
		want := s.signCallback(merchant, cb.Amount, cb.MerchantOrderID, secret)
		if subtle.ConstantTimeCompare([]byte(want), []byte(cb.Signature)) == 1 {
			return true
		}
	}
	return false
}

// HandleWebhook settles a donation from a verified Duitku callback. Caller MUST have
// verified the signature first (VerifySignature).
func (s *DuitkuService) HandleWebhook(cb DuitkuCallback) error {
	// resultCode "00" = success in Duitku.
	if strings.TrimSpace(cb.ResultCode) != "00" {
		return nil
	}
	ref := strings.TrimSpace(cb.MerchantOrderID)
	if ref == "" {
		return fmt.Errorf("duitku callback missing merchantOrderId")
	}

	dedup := cb.Reference
	if dedup == "" {
		dedup = ref
	}
	if s.processedRepo != nil {
		if seen, err := s.processedRepo.AlreadyProcessed("duitku", dedup); err == nil && seen {
			return nil
		}
	}

	inv, err := s.invoiceRepo.FindUnpaidByInvoiceNumber(ref)
	if err != nil {
		return fmt.Errorf("invoice not found: %w", err)
	}

	// Amount-tampering guard.
	if paid := parseInt64(cb.Amount); paid > 0 && paid < inv.Total {
		return fmt.Errorf("duitku amount mismatch for %s: received %d, expected %d", ref, paid, inv.Total)
	}

	if err := s.paymentSvc.ProcessPayment(inv); err != nil {
		return err
	}
	if s.processedRepo != nil {
		_, _ = s.processedRepo.MarkProcessed("duitku", dedup, inv.InvoiceNumber)
	}
	return nil
}
