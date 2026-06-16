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

// getWebhookSecret returns the secret used to verify inbound Moota webhook signatures.
// It is intentionally NOT gated on MootaEnabled: the inbound-signature secret is
// independent of whether outbound Moota polling is turned on. Gating it (the old
// behavior) made the webhook unverifiable during setup — the dashboard "Check URL"
// always 401'd until Moota was fully enabled, a chicken-and-egg blocker. DB setting
// wins; env MOOTA_WEBHOOK_SECRET is the fallback.
func (s *MootaService) getWebhookSecret() string {
	if setting, err := s.settingRepo.Get(); err == nil && setting.MootaWebhookSecret != "" {
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

// VerifySignature returns (ok, reason). reason is "" on success; otherwise a short
// diagnostic so the handler can respond with a meaningful status instead of a blanket
// 401 — which previously made "no secret configured yet" indistinguishable from "wrong
// signature", so admins couldn't tell why Moota's Check URL failed during setup.
func (s *MootaService) VerifySignature(payload []byte, signature string) (bool, string) {
	secret := s.getWebhookSecret()
	if secret == "" {
		// Fail-closed: no secret configured means we cannot verify — but surface it as a
		// server-side config gap (503), not an auth failure, so it's diagnosable.
		return false, "no webhook secret configured"
	}
	if signature == "" {
		return false, "missing X-Moota-Signature header"
	}
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	expected := hex.EncodeToString(mac.Sum(nil))
	if hmac.Equal([]byte(expected), []byte(signature)) {
		return true, ""
	}
	return false, "signature mismatch (secret/token differs from Settings → Payment → Moota)"
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
