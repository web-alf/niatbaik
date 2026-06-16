package service

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"math"
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
		return false // Fail-closed: reject if not configured
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

		// Bank mutations are whole rupiah; round (not truncate) so a float like
		// 99999.999 becomes 100000 instead of silently under-matching the invoice.
		amount := int64(math.Round(m.Amount))
		invoiceNumber := invoiceRegex.FindString(strings.ToUpper(m.Description))

		if invoiceNumber != "" {
			inv, err := s.invoiceRepo.FindUnpaidByInvoiceNumber(invoiceNumber)
			if err == nil && inv != nil {
				// The description named this invoice, but only credit it if the
				// transferred amount actually covers the total. A transfer tagged
				// with the right INV- but a smaller sum must not mark it paid.
				// >= allows the unique-code overpayment used for manual transfers.
				if amount < inv.Total {
					continue
				}
				if err = s.paymentSvc.ProcessPayment(inv); err == nil {
					processed = append(processed, inv.InvoiceNumber)
				}
				continue
			}
			// The transfer EXPLICITLY names an invoice (INV-…) that we couldn't settle
			// (already paid, or not found). Treat the tag as authoritative: do NOT fall
			// through to the amount-based fallback — that used to credit the OLDEST
			// unpaid invoice with the same total, belonging to an unrelated donor.
			continue
		}

		// Fallback: no (matching) invoice number in the description — reconcile by
		// exact total. The query matches total = amount, so the amount is verified
		// by construction here.
		inv, err := s.invoiceRepo.FindUnpaidByAmountForUpdate(amount)
		if err == nil && inv != nil {
			if err = s.paymentSvc.ProcessPayment(inv); err == nil {
				processed = append(processed, inv.InvoiceNumber)
			}
		}
	}
	return processed, nil
}
