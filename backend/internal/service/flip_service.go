package service

import (
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
	cfg         *config.Config
	paymentSvc  *PaymentService
	invoiceRepo *repository.InvoiceRepo
	settingRepo *repository.SettingRepo
}

func NewFlipService(cfg *config.Config, paymentSvc *PaymentService, invoiceRepo *repository.InvoiceRepo, settingRepo *repository.SettingRepo) *FlipService {
	return &FlipService{cfg: cfg, paymentSvc: paymentSvc, invoiceRepo: invoiceRepo, settingRepo: settingRepo}
}

func (s *FlipService) getCredentials() (secretKey, validationToken, baseURL string) {
	if setting, err := s.settingRepo.Get(); err == nil && setting.FlipEnabled {
		return setting.FlipSecretKey, setting.FlipValidationToken, setting.FlipBaseURL
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

func (s *FlipService) apiRequest(method, path string, data url.Values) ([]byte, error) {
	secretKey, _, baseURL := s.getCredentials()
	if baseURL == "" {
		baseURL = "https://bigflip.id/api/v3"
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

	data := url.Values{
		"title":                   {fmt.Sprintf("Donasi %s", invoice.InvoiceNumber)},
		"amount":                  {fmt.Sprintf("%d", invoice.Total)},
		"type":                    {"SINGLE"},
		"expired_date":            {expiry},
		"redirect_url":            {redirectURL},
		"is_address_required":     {"0"},
		"is_phone_number_required": {"0"},
		"step":                    {"2"},
		"sender_name":             {invoice.DonorName},
		"sender_email":            {invoice.DonorEmail},
	}

	respBody, err := s.apiRequest("POST", "/pwf/bill", data)
	if err != nil {
		return nil, err
	}

	var bill FlipBillResponse
	if err := json.Unmarshal(respBody, &bill); err != nil {
		return nil, err
	}

	return &bill, nil
}

func (s *FlipService) VerifyWebhookToken(token string) bool {
	if s.cfg.FlipValidationToken == "" {
		return true
	}
	return token == s.cfg.FlipValidationToken
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

	inv, err := s.invoiceRepo.FindUnpaidByInvoiceNumber(invoiceNumber)
	if err != nil {
		return fmt.Errorf("invoice not found: %w", err)
	}

	return s.paymentSvc.ProcessPayment(inv)
}

func (s *FlipService) CreateDisbursement(req FlipDisbursementRequest) (*FlipDisbursementResponse, error) {
	data := url.Values{
		"account_number": {req.AccountNumber},
		"bank_code":      {req.BankCode},
		"amount":         {fmt.Sprintf("%d", req.Amount)},
		"remark":         {req.Remark},
	}

	respBody, err := s.apiRequest("POST", "/disbursement", data)
	if err != nil {
		return nil, err
	}

	var resp FlipDisbursementResponse
	if err := json.Unmarshal(respBody, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}
