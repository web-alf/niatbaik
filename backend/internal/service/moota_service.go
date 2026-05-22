package service

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"regexp"
	"strings"

	"github.com/anrdart/niatbaik-api/internal/config"
	"github.com/anrdart/niatbaik-api/internal/repository"
)

type MootaService struct {
	cfg         *config.Config
	paymentSvc  *PaymentService
	invoiceRepo *repository.InvoiceRepo
	settingRepo *repository.SettingRepo
}

func NewMootaService(cfg *config.Config, paymentSvc *PaymentService, invoiceRepo *repository.InvoiceRepo, settingRepo *repository.SettingRepo) *MootaService {
	return &MootaService{cfg: cfg, paymentSvc: paymentSvc, invoiceRepo: invoiceRepo, settingRepo: settingRepo}
}

func (s *MootaService) getWebhookSecret() string {
	if setting, err := s.settingRepo.Get(); err == nil && setting.MootaEnabled && setting.MootaWebhookSecret != "" {
		return setting.MootaWebhookSecret
	}
	return s.cfg.MootaWebhookSecret
}

// MootaWebhookPayload represents a single mutation from Moota webhook.
type MootaWebhookPayload struct {
	ID          int64   `json:"id"`
	BankID      string  `json:"bank_id"`
	AccountNo   string  `json:"account_number"`
	BankType    string  `json:"bank_type"`
	Amount      float64 `json:"amount"`
	Description string  `json:"description"`
	Type        string  `json:"type"` // "CR" for credit (incoming)
	Balance     float64 `json:"balance"`
	CreatedAt   string  `json:"created_at"`
	Token       string  `json:"token"`
}

func (s *MootaService) VerifySignature(payload []byte, signature string) bool {
	secret := s.getWebhookSecret()
	if secret == "" {
		return true
	}
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(signature))
}

func (s *MootaService) HandleWebhook(mutations []MootaWebhookPayload) ([]string, error) {
	var processed []string
	invoiceRegex := regexp.MustCompile(`INV-[A-Z0-9]+`)

	for _, m := range mutations {
		if m.Type != "CR" || m.Amount <= 0 {
			continue
		}

		amount := int64(m.Amount)
		invoiceNumber := invoiceRegex.FindString(strings.ToUpper(m.Description))

		if invoiceNumber != "" {
			inv, err := s.invoiceRepo.FindUnpaidByInvoiceNumber(invoiceNumber)
			if err == nil && inv != nil {
				if err = s.paymentSvc.ProcessPayment(inv); err == nil {
					processed = append(processed, inv.InvoiceNumber)
				}
				continue
			}
		}

		inv, err := s.invoiceRepo.FindUnpaidByAmountForUpdate(amount)
		if err == nil && inv != nil {
			if err = s.paymentSvc.ProcessPayment(inv); err == nil {
				processed = append(processed, inv.InvoiceNumber)
			}
		}
	}
	return processed, nil
}
