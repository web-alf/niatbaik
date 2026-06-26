package service

import (
	"bytes"
	"crypto/subtle"
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

// XenditService integrates Xendit's hosted Invoice (Payment Links) API. It mirrors
// FlipService: create a hosted invoice → store the invoice_url on the donation invoice →
// redirect the donor → settle on the inbound webhook. Same base URL for test and live; the
// SECRET KEY PREFIX (xnd_development_* vs xnd_production_*) selects the environment, so
// there is no sandbox/prod URL switch — XenditMode in settings is only a display reminder.
type XenditService struct {
	cfg           *config.Config
	paymentSvc    *PaymentService
	invoiceRepo   *repository.InvoiceRepo
	settingRepo   *repository.SettingRepo
	processedRepo *repository.ProcessedWebhookRepo
}

func NewXenditService(cfg *config.Config, paymentSvc *PaymentService, invoiceRepo *repository.InvoiceRepo, settingRepo *repository.SettingRepo, processedRepo *repository.ProcessedWebhookRepo) *XenditService {
	return &XenditService{cfg: cfg, paymentSvc: paymentSvc, invoiceRepo: invoiceRepo, settingRepo: settingRepo, processedRepo: processedRepo}
}

// xenditBaseURL is the SAME for test + live (the key prefix selects the environment).
const xenditBaseURL = "https://api.xendit.co"

func (s *XenditService) getCredentials() (secretKey, callbackToken string) {
	if setting, err := s.settingRepo.Get(); err == nil && setting != nil {
		return setting.XenditSecretKey, setting.XenditCallbackToken
	}
	return "", ""
}

// XenditInvoiceResponse is the subset of Xendit's create-invoice response we use.
type XenditInvoiceResponse struct {
	ID         string  `json:"id"`
	ExternalID string  `json:"external_id"`
	InvoiceURL string  `json:"invoice_url"`
	Status     string  `json:"status"`
	Amount     float64 `json:"amount"`
	ExpiryDate string  `json:"expiry_date"`
}

// XenditWebhookPayload is the Invoice "paid" callback. Xendit's docs show camelCase in some
// places and snake_case in others, so we accept BOTH spellings for the fields we read and
// reconcile them in normalize() — a casing mismatch silently leaving donations unpaid is
// exactly the kind of bug we must avoid.
type XenditWebhookPayload struct {
	ID              string  `json:"id"`
	ExternalID      string  `json:"external_id"`
	ExternalIDCamel string  `json:"externalId"`
	Status          string  `json:"status"`
	Amount          float64 `json:"amount"`
	PaidAmount      float64 `json:"paid_amount"`
	PaidAmountCamel float64 `json:"paidAmount"`
	PaidAt          string  `json:"paid_at"`
}

// normalize folds the camelCase aliases into the canonical snake_case fields.
func (p *XenditWebhookPayload) normalize() {
	if p.ExternalID == "" && p.ExternalIDCamel != "" {
		p.ExternalID = p.ExternalIDCamel
	}
	if p.PaidAmount == 0 && p.PaidAmountCamel != 0 {
		p.PaidAmount = p.PaidAmountCamel
	}
}

// CreateInvoice creates a hosted Xendit invoice for the donation and returns the hosted
// payment page (invoice_url) the donor is redirected to. Mirrors FlipService.CreateBill.
func (s *XenditService) CreateInvoice(invoice *model.Invoice, redirectURL string) (*XenditInvoiceResponse, error) {
	secretKey, _ := s.getCredentials()
	if strings.TrimSpace(secretKey) == "" {
		return nil, fmt.Errorf("xendit secret key not configured")
	}

	// Xendit requires payer_email; the donation form often disables the email field, so fall
	// back to a deterministic no-reply address (same approach as Flip's sender_email fix).
	payerEmail := strings.TrimSpace(invoice.DonorEmail)
	if payerEmail == "" {
		payerEmail = "noreply+" + strings.ToLower(invoice.InvoiceNumber) + "@niatbaik.org"
	}

	body := map[string]interface{}{
		"external_id":          invoice.InvoiceNumber,
		"amount":               invoice.Total,
		"payer_email":          payerEmail,
		"description":          fmt.Sprintf("Donasi %s", invoice.InvoiceNumber),
		"success_redirect_url": redirectURL,
		"failure_redirect_url": redirectURL,
		"invoice_duration":     86400, // 24h, matches the invoice ExpiredAt window
		"currency":             "IDR",
	}
	payload, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", xenditBaseURL+"/v2/invoices", bytes.NewReader(payload))
	if err != nil {
		return nil, err
	}
	// HTTP Basic auth: secret key as username, blank password.
	req.SetBasicAuth(secretKey, "")
	req.Header.Set("Content-Type", "application/json")

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
		return nil, fmt.Errorf("xendit API error %d: %s", resp.StatusCode, string(respBody))
	}

	var inv XenditInvoiceResponse
	if err := json.Unmarshal(respBody, &inv); err != nil {
		return nil, err
	}
	// Guard against a 2xx with an unusable invoice (bad creds / malformed) so CreateDonation
	// degrades to manual instead of stranding the donor on a broken page (mirrors Flip).
	if inv.ID == "" || inv.InvoiceURL == "" {
		return nil, fmt.Errorf("xendit returned an invalid invoice (no id/url): %s", string(respBody))
	}
	return &inv, nil
}

// VerifyCallbackToken constant-time-compares the inbound X-CALLBACK-TOKEN header against the
// static token configured in the Xendit dashboard. Fail-closed when unset.
func (s *XenditService) VerifyCallbackToken(token string) bool {
	_, callbackToken := s.getCredentials()
	if strings.TrimSpace(callbackToken) == "" {
		return false
	}
	return subtle.ConstantTimeCompare([]byte(token), []byte(callbackToken)) == 1
}

// HandleWebhook settles a donation from a verified Xendit invoice callback. Caller MUST have
// already verified the X-CALLBACK-TOKEN header (HandleXendit does this before unmarshaling).
func (s *XenditService) HandleWebhook(payload XenditWebhookPayload) error {
	payload.normalize()

	// Only settle on a paid status (Xendit uses PAID; SETTLED is an alias in some flows).
	if !strings.EqualFold(payload.Status, "PAID") && !strings.EqualFold(payload.Status, "SETTLED") {
		return nil
	}
	if payload.ExternalID == "" {
		return fmt.Errorf("xendit webhook missing external_id")
	}

	// Replay guard: Xendit retries up to 6x with backoff. Dedup on the invoice id so
	// settlement is idempotent (mirrors Flip/Moota).
	if s.processedRepo != nil && payload.ID != "" {
		if seen, derr := s.processedRepo.AlreadyProcessed("xendit", payload.ID); derr == nil && seen {
			return nil
		}
	}

	inv, err := s.invoiceRepo.FindUnpaidByInvoiceNumber(payload.ExternalID)
	if err != nil {
		return fmt.Errorf("invoice not found: %w", err)
	}

	// Verify the paid amount actually covers the invoice before crediting (amount-tampering /
	// forged-callback guard). Prefer paid_amount; fall back to amount. Use >= so an
	// accidental overpayment still settles rather than getting stuck unpaid.
	paid := payload.PaidAmount
	if paid == 0 {
		paid = payload.Amount
	}
	if int64(paid) < inv.Total {
		return fmt.Errorf("xendit amount mismatch for %s: received %d, expected %d", payload.ExternalID, int64(paid), inv.Total)
	}

	if err := s.paymentSvc.ProcessPayment(inv); err != nil {
		return err
	}
	if s.processedRepo != nil && payload.ID != "" {
		_, _ = s.processedRepo.MarkProcessed("xendit", payload.ID, inv.InvoiceNumber)
	}
	return nil
}
