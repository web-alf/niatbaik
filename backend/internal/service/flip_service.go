package service

import (
	"crypto/subtle"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/anrdart/niatbaik-api/internal/config"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
)

type FlipService struct {
	cfg          *config.Config
	paymentSvc   *PaymentService
	invoiceRepo  *repository.InvoiceRepo
	settingRepo  *repository.SettingRepo
	processedRepo *repository.ProcessedWebhookRepo
}

func NewFlipService(cfg *config.Config, paymentSvc *PaymentService, invoiceRepo *repository.InvoiceRepo, settingRepo *repository.SettingRepo, processedRepo *repository.ProcessedWebhookRepo) *FlipService {
	return &FlipService{cfg: cfg, paymentSvc: paymentSvc, invoiceRepo: invoiceRepo, settingRepo: settingRepo, processedRepo: processedRepo}
}

// Flip API base hosts (NO version segment). Production is bigflip.id/api; the
// sandbox (Big Flip "test") environment is bigflip.id/big_sandbox_api.
// getCredentials picks the host from the admin's Flip Mode setting when an
// explicit base URL isn't configured. The API VERSION is appended per-endpoint
// in apiRequest, because Flip versions endpoints inconsistently: Accept Payment
// (pwf/bill) lives at /v2 in BOTH sandbox and prod (the sandbox has no /v3/pwf/bill
// — it 404s), while Disbursement is at /v3. Hardcoding one version for all
// endpoints made every sandbox CreateBill 404 and silently fall back to manual.
const (
	flipProdHost    = "https://bigflip.id/api"
	flipSandboxHost = "https://bigflip.id/big_sandbox_api"
)

func (s *FlipService) getCredentials() (secretKey, validationToken, baseURL string) {
	if setting, err := s.settingRepo.Get(); err == nil && setting.FlipEnabled {
		base := setting.FlipBaseURL
		if base == "" {
			// Derive from Flip Mode (sandbox/production) so the admin only toggles a
			// mode instead of pasting the right API host.
			if strings.EqualFold(strings.TrimSpace(setting.FlipMode), "sandbox") {
				base = flipSandboxHost
			} else {
				base = flipProdHost
			}
		}
		return setting.FlipSecretKey, setting.FlipValidationToken, base
	}
	return s.cfg.FlipSecretKey, s.cfg.FlipValidationToken, s.cfg.FlipBaseURL
}

// FlipBillResponse is the response from Flip bill creation API.
type FlipBillResponse struct {
	LinkID      int64  `json:"link_id"`
	LinkURL     string `json:"link_url"`
	Title       string `json:"title"`
	Amount      int64  `json:"amount"`
	Status      string `json:"status"`
	ExpiredDate string `json:"expired_date"`
	CreatedFrom string `json:"created_from"`
	PaymentURL  string `json:"payment_url"`
}

// FlipWebhookPayload is the webhook payload from Flip on payment events.
type FlipWebhookPayload struct {
	ID             int64  `json:"id"`
	BillLinkID     int64  `json:"bill_link_id"`
	BillLink       string `json:"bill_link"`
	BillTitle      string `json:"bill_title"`
	SenderName     string `json:"sender_name"`
	SenderBank     string `json:"sender_bank"`
	SenderBankType string `json:"sender_bank_type"`
	Amount         int64  `json:"amount"`
	Status         string `json:"status"` // SUCCESSFUL, CANCELLED, FAILED
	SenderEmail    string `json:"sender_email"`
	CreatedAt      string `json:"created_at"`
}

// FlipDisbursementRequest for payouts to campaign owners.
type FlipDisbursementRequest struct {
	AccountNumber  string `json:"account_number"`
	BankCode       string `json:"bank_code"`
	Amount         int64  `json:"amount"`
	Remark         string `json:"remark"`
	IdempotencyKey string `json:"idempotency-key"`
}

// FlipDisbursementResponse from Flip disbursement API.
type FlipDisbursementResponse struct {
	ID            int64  `json:"id"`
	Amount        int64  `json:"amount"`
	Status        string `json:"status"`
	BankCode      string `json:"bank_code"`
	AccountNumber string `json:"account_number"`
	Remark        string `json:"remark"`
	Fee           int64  `json:"fee"`
	CreatedAt     string `json:"created_at"`
}

// flipBaseHost normalizes a Flip base URL to a host-only form: it strips a
// trailing slash and a trailing /v2 or /v3 version segment. This lets apiRequest
// append the correct version per endpoint regardless of whether the configured
// base (from getCredentials or an admin override) still carries a legacy version
// segment. Examples:
//
//	https://bigflip.id/big_sandbox_api/v3 -> https://bigflip.id/big_sandbox_api
//	https://bigflip.id/api/v3/            -> https://bigflip.id/api
//	https://bigflip.id/api                -> https://bigflip.id/api
func flipBaseHost(base string) string {
	base = strings.TrimRight(strings.TrimSpace(base), "/")
	if strings.HasSuffix(base, "/v2") || strings.HasSuffix(base, "/v3") {
		base = base[:len(base)-3]
	}
	return strings.TrimRight(base, "/")
}

// apiRequest performs an authenticated Flip API call. path MUST include the API
// version segment (e.g. "/v2/pwf/bill", "/v3/disbursement") because Flip versions
// endpoints inconsistently — the base from getCredentials is host-only.
func (s *FlipService) apiRequest(method, path string, data url.Values) ([]byte, error) {
	secretKey, _, baseURL := s.getCredentials()
	baseURL = flipBaseHost(baseURL)
	if baseURL == "" {
		baseURL = flipProdHost
	}
	var body io.Reader
	if data != nil {
		body = strings.NewReader(data.Encode())
	}

	req, err := http.NewRequest(method, baseURL+path, body)
	if err != nil {
		return nil, err
	}

	req.SetBasicAuth(secretKey+":", "")
	if data != nil {
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	}

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
		return nil, fmt.Errorf("flip API error %d: %s", resp.StatusCode, string(respBody))
	}
	return respBody, nil
}

func (s *FlipService) CreateBill(invoice *model.Invoice, redirectURL string) (*FlipBillResponse, error) {
	expiry := invoice.ExpiredAt.Format("2006-01-02 15:04")

	// Flip's Accept-Payment API REQUIRES sender_email (returns 422 VALIDATION_ERROR
	// "Param sender_email is required" otherwise). The donation form often has the email
	// field disabled, so DonorEmail is blank — which 422'd EVERY Flip bill. Fall back to a
	// deterministic no-reply address derived from the invoice so the bill always validates;
	// it's only used by Flip to email a receipt (the donor pays on Flip's hosted page).
	senderEmail := strings.TrimSpace(invoice.DonorEmail)
	if senderEmail == "" {
		senderEmail = "noreply+" + strings.ToLower(invoice.InvoiceNumber) + "@niatbaik.org"
	}
	senderName := strings.TrimSpace(invoice.DonorName)
	if senderName == "" {
		senderName = "Donatur"
	}

	data := url.Values{
		"title":                   {fmt.Sprintf("Donasi %s", invoice.InvoiceNumber)},
		"amount":                  {fmt.Sprintf("%d", invoice.Total)},
		"type":                    {"SINGLE"},
		"expired_date":            {expiry},
		"redirect_url":            {redirectURL},
		"is_address_required":     {"0"},
		"is_phone_number_required": {"0"},
		"step":                    {"2"},
		"sender_name":             {senderName},
		"sender_email":            {senderEmail},
	}

	// Accept Payment lives at /v2 in both sandbox and prod (sandbox has no /v3/pwf/bill).
	respBody, err := s.apiRequest("POST", "/v2/pwf/bill", data)
	if err != nil {
		return nil, err
	}

	var bill FlipBillResponse
	if err := json.Unmarshal(respBody, &bill); err != nil {
		return nil, err
	}

	// Flip's create-bill response carries the donor-facing page in `link_url` (e.g.
	// "flip.id/pwf-sandbox/$slug/#..."), and only returns `payment_url` in some
	// flows/environments. The sandbox omits `payment_url` entirely, so requiring it
	// wrongly rejected a perfectly valid ACTIVE bill (link_id + link_url present) and
	// stranded every donation as UNPAYABLE. Accept either; prefer payment_url, fall back
	// to link_url, and normalize a scheme-less link to https so the donor redirect works.
	if bill.PaymentURL == "" {
		bill.PaymentURL = bill.LinkURL
	}
	if bill.PaymentURL != "" && !strings.HasPrefix(bill.PaymentURL, "http://") && !strings.HasPrefix(bill.PaymentURL, "https://") {
		bill.PaymentURL = "https://" + bill.PaymentURL
	}

	// Flip returns 2xx even for logical errors (bad credentials, malformed request) with
	// a body that unmarshals cleanly into a zero-value bill. Treat an unusable bill
	// (no link id / no URL at all) as a failure so CreateDonation falls back to manual
	// transfer instead of persisting PayCode="0" + empty QR and stranding the donor on a
	// broken payment page.
	if bill.LinkID == 0 || bill.PaymentURL == "" {
		return nil, fmt.Errorf("flip returned an invalid bill (no link/url): %s", string(respBody))
	}

	return &bill, nil
}

func (s *FlipService) VerifyWebhookToken(token string) bool {
	_, validationToken, _ := s.getCredentials()
	if validationToken == "" {
		return false // Fail-closed: reject if not configured
	}
	// Constant-time compare so an attacker can't recover the token byte-by-byte
	// from response-timing differences of a plain string ==.
	return subtle.ConstantTimeCompare([]byte(token), []byte(validationToken)) == 1
}

func (s *FlipService) HandleWebhook(payload FlipWebhookPayload) error {
	if payload.Status != "SUCCESSFUL" {
		return nil
	}

	billTitle := payload.BillTitle
	invoiceNumber := ""
	if strings.Contains(billTitle, "INV-") {
		parts := strings.Fields(billTitle)
		for _, p := range parts {
			if strings.HasPrefix(p, "INV-") {
				invoiceNumber = p
				break
			}
		}
	}

	if invoiceNumber == "" {
		return errors.New("no invoice number in bill title")
	}

	// Replay guard: if Flip's validation token leaks, a captured SUCCESSFUL payload could
	// be replayed. Dedup on Flip's event id before settling. The per-invoice IsPaid guard
	// in ProcessPayment already blocks double-credit of the SAME invoice, but recording the
	// event id makes the intent explicit and covers the amount path symmetrically with Moota.
	if s.processedRepo != nil && payload.ID != 0 {
		extID := fmt.Sprintf("%d", payload.ID)
		if seen, derr := s.processedRepo.AlreadyProcessed("flip", extID); derr == nil && seen {
			return nil // already handled — replay/duplicate
		}
	}

	inv, err := s.invoiceRepo.FindUnpaidByInvoiceNumber(invoiceNumber)
	if err != nil {
		return fmt.Errorf("invoice not found: %w", err)
	}

	// Verify the paid amount actually covers the invoice before crediting. Flip
	// is a hosted gateway, so a SUCCESSFUL event should always equal inv.Total,
	// but a forged/replayed webhook (token leak) or a partial-payment edge case
	// must never credit the campaign for more than was received. Use >= (not ==)
	// so an accidental overpayment still settles rather than getting stuck unpaid.
	if payload.Amount < inv.Total {
		return fmt.Errorf("flip amount mismatch for %s: received %d, expected %d", invoiceNumber, payload.Amount, inv.Total)
	}

	if err := s.paymentSvc.ProcessPayment(inv); err != nil {
		return err
	}
	if s.processedRepo != nil && payload.ID != 0 {
		_, _ = s.processedRepo.MarkProcessed("flip", fmt.Sprintf("%d", payload.ID), inv.InvoiceNumber)
	}
	return nil
}

func (s *FlipService) CreateDisbursement(req FlipDisbursementRequest) (*FlipDisbursementResponse, error) {
	data := url.Values{
		"account_number": {req.AccountNumber},
		"bank_code":      {req.BankCode},
		"amount":         {fmt.Sprintf("%d", req.Amount)},
		"remark":         {req.Remark},
	}

	respBody, err := s.apiRequest("POST", "/v3/disbursement", data)
	if err != nil {
		return nil, err
	}

	var resp FlipDisbursementResponse
	if err := json.Unmarshal(respBody, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}
