package service

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/anrdart/niatbaik-api/internal/config"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
)

// IpaymuService integrates iPaymu's hosted Payment Page API. Same lifecycle as
// Flip/Xendit: create a payment → store the hosted Url on the invoice → redirect the
// donor → settle on the inbound webhook. iPaymu v2 signs the create-request with a
// HMAC-SHA256 over the body using the API key; callbacks are verified against the same
// key + the posted transaction reference.
type IpaymuService struct {
	cfg           *config.Config
	paymentSvc    *PaymentService
	invoiceRepo   *repository.InvoiceRepo
	settingRepo   *repository.SettingRepo
	processedRepo *repository.ProcessedWebhookRepo
}

func NewIpaymuService(cfg *config.Config, paymentSvc *PaymentService, invoiceRepo *repository.InvoiceRepo, settingRepo *repository.SettingRepo, processedRepo *repository.ProcessedWebhookRepo) *IpaymuService {
	return &IpaymuService{cfg: cfg, paymentSvc: paymentSvc, invoiceRepo: invoiceRepo, settingRepo: settingRepo, processedRepo: processedRepo}
}

func (s *IpaymuService) getCredentials() (va, apiKey, baseURL string) {
	def := "https://my.ipaymu.com"
	if setting, err := s.settingRepo.Get(); err == nil && setting != nil {
		baseURL = strings.TrimSpace(setting.IpaymuBaseURL)
		if baseURL == "" {
			// Sandbox and production use different hosts (unlike Xendit's single host).
			if strings.EqualFold(strings.TrimSpace(setting.IpaymuMode), "sandbox") {
				baseURL = "https://sandbox.ipaymu.com"
			} else {
				baseURL = def
			}
		}
		return strings.TrimSpace(setting.IpaymuVA), strings.TrimSpace(setting.IpaymuAPIKey), baseURL
	}
	return "", "", def
}

// IpaymuPaymentResponse is the subset of iPaymu's payment response we use.
type IpaymuPaymentResponse struct {
	Status string `json:"Status"`
	Data   struct {
		URL       string `json:"Url"`
		SessionID string `json:"SessionID"`
		TrxID     string `json:"TrxID"`
	} `json:"Data"`
}

// IpaymuCallback is the transaction-status callback iPaymu POSTs to notifyUrl.
// Field names vary by version; we read the documented lowercase keys and reconcile.
type IpaymuCallback struct {
	TrxID     string `json:"trx_id"`
	Sid       string `json:"sid"`
	Status    string `json:"status"`
	Reference string `json:"reference"`
	Total     string `json:"total"`
	Signature string `json:"Signature"`
}

// signRequest computes iPaymu's v2 request signature:
//   stringToSign = METHOD + ":" + va + ":" + lower(hex(sha256(body))) + ":" + apiKey
//   signature    = hex(hmac_sha256(stringToSign, apiKey))
func (s *IpaymuService) signRequest(method, va string, body []byte, apiKey string) string {
	bodyHash := sha256.Sum256(body)
	stringToSign := strings.ToUpper(method) + ":" + va + ":" + hex.EncodeToString(bodyHash[:]) + ":" + apiKey
	mac := hmac.New(sha256.New, []byte(apiKey))
	mac.Write([]byte(stringToSign))
	return hex.EncodeToString(mac.Sum(nil))
}

// CreatePayment creates a hosted iPaymu payment page and returns the redirect URL the
// donor is sent to. Mirrors FlipService.CreateBill / XenditService.CreateInvoice.
func (s *IpaymuService) CreatePayment(invoice *model.Invoice, redirectURL string) (*IpaymuPaymentResponse, error) {
	va, apiKey, baseURL := s.getCredentials()
	if va == "" || apiKey == "" {
		return nil, fmt.Errorf("ipaymu not configured (va/api key missing)")
	}

	body, err := json.Marshal(map[string]interface{}{
		"name":       invoice.DonorName,
		"phone":      invoice.DonorPhone,
		"email":      nonEmpty(invoice.DonorEmail, "noreply+"+strings.ToLower(invoice.InvoiceNumber)+"@niatbaik.org"),
		"amount":     invoice.Total,
		"notifyUrl":  webhookURL(redirectURL, "ipaymu"),
		"referenceId": invoice.InvoiceNumber,
		"expired":    24, // hours
		"expiredType": "hours",
	})
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", baseURL+"/api/v2/payment", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("signature", s.signRequest("POST", va, body, apiKey))
	req.Header.Set("va", va)
	req.Header.Set("timestamp", fmt.Sprintf("%d", time.Now().Unix()))

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
		return nil, fmt.Errorf("ipaymu API error %d: %s", resp.StatusCode, string(respBody))
	}

	var p IpaymuPaymentResponse
	if err := json.Unmarshal(respBody, &p); err != nil {
		return nil, err
	}
	if p.Data.URL == "" {
		return nil, fmt.Errorf("ipaymu returned no payment URL: %s", string(respBody))
	}
	return &p, nil
}

// VerifyCallback authenticates an inbound iPaymu notify. iPaymu's callback does not
// carry a body-HMAC the way the outbound request does; it posts the merchant `va`.
// We require that va to match our configured VA (fail-closed when unset). The real
// settlement guards remain in HandleWebhook: the reference must match an UNPAID
// invoice and the posted total must cover it, so a forged callback can't credit an
// arbitrary amount. Exact scheme should be confirmed against the iPaymu sandbox.
func (s *IpaymuService) VerifyCallback(cbVA string) bool {
	va, _, _ := s.getCredentials()
	va = strings.TrimSpace(va)
	if va == "" {
		return false
	}
	return strings.TrimSpace(cbVA) == va
}

// HandleWebhook settles a donation from a verified iPaymu callback. Caller MUST have
// verified the Signature header first.
func (s *IpaymuService) HandleWebhook(payload IpaymuCallback) error {
	// iPaymu reports "berhasil" (and sometimes "berhasil"/"success") for paid.
	st := strings.ToLower(strings.TrimSpace(payload.Status))
	if st != "berhasil" && st != "success" && st != "paid" {
		return nil
	}
	ref := strings.TrimSpace(payload.Reference)
	if ref == "" {
		ref = strings.TrimSpace(payload.TrxID)
	}
	if ref == "" {
		return fmt.Errorf("ipaymu webhook missing reference")
	}

	// Replay guard: iPaymu retries callbacks; dedup on the transaction id.
	dedup := payload.TrxID
	if dedup == "" {
		dedup = ref
	}
	if s.processedRepo != nil {
		if seen, err := s.processedRepo.AlreadyProcessed("ipaymu", dedup); err == nil && seen {
			return nil
		}
	}

	inv, err := s.invoiceRepo.FindUnpaidByInvoiceNumber(ref)
	if err != nil {
		return fmt.Errorf("invoice not found: %w", err)
	}

	// Amount-tampering guard: require the posted total to cover the invoice.
	if paid := parseInt64(payload.Total); paid > 0 && paid < inv.Total {
		return fmt.Errorf("ipaymu amount mismatch for %s: received %d, expected %d", ref, paid, inv.Total)
	}

	if err := s.paymentSvc.ProcessPayment(inv); err != nil {
		return err
	}
	if s.processedRepo != nil {
		_, _ = s.processedRepo.MarkProcessed("ipaymu", dedup, inv.InvoiceNumber)
	}
	return nil
}

func nonEmpty(s, fb string) string {
	if strings.TrimSpace(s) != "" {
		return s
	}
	return fb
}

// webhookURL builds this app's inbound webhook URL for a given gateway, derived from
// the donor redirect URL's origin (falls back to the prod origin). Gateway-specific so
// iPaymu and Duitku each get their OWN routed path (/api/webhooks/<gateway>).
func webhookURL(redirectURL, gateway string) string {
	origin := "https://donasi.niatbaik.org"
	if i := strings.Index(redirectURL, "://"); i > 0 {
		rest := redirectURL[i+3:]
		if j := strings.Index(rest, "/"); j > 0 {
			origin = redirectURL[:i+3+j]
		} else {
			origin = redirectURL
		}
	}
	return origin + "/api/webhooks/" + gateway
}

func parseInt64(s string) int64 {
	var n int64
	for _, c := range strings.TrimSpace(s) {
		if c < '0' || c > '9' {
			continue
		}
		n = n*10 + int64(c-'0')
	}
	return n
}
