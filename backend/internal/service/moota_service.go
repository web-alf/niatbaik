package service

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"math"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/anrdart/niatbaik-api/internal/config"
	"github.com/anrdart/niatbaik-api/internal/repository"
)

// Moota types its webhook fields inconsistently: top-level account_number/amount/
// balance arrive as bare JSON numbers, but the nested bank object sends the same
// concepts as strings ("123123123123", "8704362.00"). A plain `string`/`float64`
// field fails json.Unmarshal on the unexpected token, which rejected the ENTIRE
// payload with 400 "Invalid payload" — silently dropping a real, signature-valid
// mutation. These flexible types accept either representation so reconciliation
// never breaks on Moota's loose typing.

// flexString accepts a JSON string OR number, keeping the raw textual form.
type flexString string

func (f *flexString) UnmarshalJSON(b []byte) error {
	if len(b) == 0 || string(b) == "null" {
		*f = ""
		return nil
	}
	if b[0] == '"' {
		var s string
		if err := json.Unmarshal(b, &s); err != nil {
			return err
		}
		*f = flexString(s)
		return nil
	}
	*f = flexString(string(b)) // number (or other bare token) → its literal text
	return nil
}

// flexFloat accepts a JSON number OR a numeric string ("10000.00").
type flexFloat float64

func (f *flexFloat) UnmarshalJSON(b []byte) error {
	s := strings.Trim(string(b), `"`)
	if s == "" || s == "null" {
		*f = 0
		return nil
	}
	v, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return err
	}
	*f = flexFloat(v)
	return nil
}

type MootaService struct {
	cfg          *config.Config
	paymentSvc   *PaymentService
	invoiceRepo  *repository.InvoiceRepo
	settingRepo  *repository.SettingRepo
	processedRepo *repository.ProcessedWebhookRepo
}

func NewMootaService(cfg *config.Config, paymentSvc *PaymentService, invoiceRepo *repository.InvoiceRepo, settingRepo *repository.SettingRepo, processedRepo *repository.ProcessedWebhookRepo) *MootaService {
	return &MootaService{cfg: cfg, paymentSvc: paymentSvc, invoiceRepo: invoiceRepo, settingRepo: settingRepo, processedRepo: processedRepo}
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

// SignatureCheckEnabled reports whether inbound webhooks must carry a valid HMAC
// signature. Mirrors the Settings → Payment → Moota "Signature Moota" toggle, which
// until now was stored but never read — the handler always enforced the signature,
// so the UI's "nonaktifkan jika bermasalah" escape hatch did nothing. Defaults to
// true (fail-closed) on a read error.
//
// SECURITY: when an admin turns this OFF, the payment-confirming webhook is accepted
// with NO authentication — only the secrecy of the endpoint URL guards it. It exists
// purely as a setup-time escape hatch while Moota's signing scheme is being matched;
// it must be turned back ON for normal operation.
func (s *MootaService) SignatureCheckEnabled() bool {
	// In production the signature check can NEVER be disabled: the "Signature Moota"
	// toggle is a setup-time escape hatch only. An admin (or a corrupted setting)
	// leaving it off in prod would expose an unauthenticated, payment-confirming
	// webhook — anyone learning the URL could forge "paid" mutations, inflate campaign
	// balances, and trigger fraudulent referral commissions. Force-on in prod.
	if s.cfg != nil && s.cfg.IsProduction() {
		return true
	}
	if setting, err := s.settingRepo.Get(); err == nil {
		return setting.MootaSignatureEnabled
	}
	return true
}

// ExpectedSignature returns the hex HMAC-SHA256 of payload under the configured
// secret. Exposed so the handler can log our computed value next to the header Moota
// actually sent, to confirm the signing scheme during setup. "" when no secret.
func (s *MootaService) ExpectedSignature(payload []byte) string {
	secret := s.getWebhookSecret()
	if secret == "" {
		return ""
	}
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	return hex.EncodeToString(mac.Sum(nil))
}

// MootaWebhookPayload represents a single mutation from Moota webhook. Fields use
// flex types because Moota sends numbers and strings interchangeably across its
// payload (see flexString/flexFloat). ID is flexString too — Moota's mutation id is
// an alphanumeric token like "VSO78wsOJ0nu9", not an integer.
type MootaWebhookPayload struct {
	ID          flexString `json:"id"`
	MutationID  flexString `json:"mutation_id"`
	BankID      flexString `json:"bank_id"`
	AccountNo   flexString `json:"account_number"`
	BankType    flexString `json:"bank_type"`
	Amount      flexFloat  `json:"amount"`
	Description string     `json:"description"`
	Type        string     `json:"type"` // "CR" for credit (incoming)
	Balance     flexFloat  `json:"balance"`
	CreatedAt   string     `json:"created_at"`
	Token       flexString `json:"token"`
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
		return false, "missing signature header (none of X-Moota-Signature / Signature / X-Signature present)"
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
	var settleErrs []string
	invoiceRegex := regexp.MustCompile(`INV-[A-Z0-9]+`)

	// Whether unique-code disambiguation is OFF. When it is, two different donors can
	// transfer the same round amount and the amount-only fallback can't tell them apart,
	// so we refuse to auto-settle an untagged transfer (require the INV- tag instead).
	uniqueDisabled := false
	if setting, err := s.settingRepo.Get(); err == nil && setting != nil {
		uniqueDisabled = strings.EqualFold(strings.TrimSpace(setting.UniqueCodeMode), "none")
	}

	for _, m := range mutations {
		if m.Type != "CR" || m.Amount <= 0 {
			continue
		}

		// Replay/duplicate guard: Moota signs only the body (no nonce/timestamp), so a
		// captured valid delivery can be replayed. Dedup on Moota's own mutation id. We
		// only check-existing here (read), and RECORD the id after a SUCCESSFUL settle
		// below — so a settlement that errored isn't marked done, letting Moota's retry
		// reprocess it, while a replay of an already-settled mutation is skipped.
		externalID := strings.TrimSpace(string(m.ID))
		if externalID == "" {
			externalID = strings.TrimSpace(string(m.MutationID))
		}
		if s.processedRepo != nil && externalID != "" {
			if seen, err := s.processedRepo.AlreadyProcessed("moota", externalID); err == nil && seen {
				continue // already handled — replay/duplicate
			}
		}
		// recordDedup marks this mutation handled AFTER a successful settle, so a failed
		// settlement stays un-recorded and Moota's retry can reprocess it.
		recordDedup := func(invNo string) {
			if s.processedRepo != nil && externalID != "" {
				_, _ = s.processedRepo.MarkProcessed("moota", externalID, invNo)
			}
		}

		// Bank mutations are whole rupiah; round (not truncate) so a float like
		// 99999.999 becomes 100000 instead of silently under-matching the invoice.
		amount := int64(math.Round(float64(m.Amount)))
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
					recordDedup(inv.InvoiceNumber)
				} else {
					settleErrs = append(settleErrs, fmt.Sprintf("%s: %v", inv.InvoiceNumber, err))
				}
				continue
			}
			// The transfer EXPLICITLY names an invoice (INV-…) that we couldn't settle
			// (already paid, or not found). Treat the tag as authoritative: do NOT fall
			// through to the amount-based fallback — that used to credit the OLDEST
			// unpaid invoice with the same total, belonging to an unrelated donor.
			continue
		}

		// Fallback: no invoice number in the description — reconcile by exact total.
		// When unique codes are disabled, the amount alone can't disambiguate donors, so
		// refuse the untagged transfer rather than risk crediting the wrong invoice.
		if uniqueDisabled {
			log.Printf("[moota-webhook] untagged transfer of %d skipped: unique_code_mode=none, cannot disambiguate; needs manual review", amount)
			continue
		}
		// Guard against ambiguity: if more than one unpaid invoice shares this total, the
		// finder would settle the OLDEST — possibly the wrong donor's. Queue for manual
		// review instead of guessing.
		if n, err := s.invoiceRepo.CountUnpaidByAmount(amount); err == nil && n > 1 {
			log.Printf("[moota-webhook] ambiguous transfer of %d skipped: %d unpaid invoices share this total; needs manual review", amount, n)
			continue
		}
		inv, err := s.invoiceRepo.FindUnpaidByAmountForUpdate(amount)
		if err == nil && inv != nil {
			if err = s.paymentSvc.ProcessPayment(inv); err == nil {
				processed = append(processed, inv.InvoiceNumber)
				recordDedup(inv.InvoiceNumber)
			} else {
				settleErrs = append(settleErrs, fmt.Sprintf("%s: %v", inv.InvoiceNumber, err))
			}
		}
	}

	// Surface settlement failures so the handler returns non-2xx and Moota retries the
	// delivery — a swallowed ProcessPayment error used to 200-ack a transfer that never
	// credited, permanently losing it. Dedup above makes the retry safe (no double credit).
	if len(settleErrs) > 0 {
		return processed, fmt.Errorf("moota settlement errors: %s", strings.Join(settleErrs, "; "))
	}
	return processed, nil
}

// MootaBankResponse represents the banks array returned by Moota API /v2/bank
type MootaBankResponse struct {
	Data []struct {
		BankID        string  `json:"bank_id"`
		AccountName   string  `json:"name"`
		AccountNumber string  `json:"account_number"`
		BankType      string  `json:"bank_type"`
		Balance       float64 `json:"balance"`
		IsActive      bool    `json:"is_active"`
	} `json:"data"`
}

// CheckBalance calls the Moota API to fetch the current balances of connected banks.
func (s *MootaService) CheckBalance() (*MootaBankResponse, error) {
	setting, err := s.settingRepo.Get()
	if err != nil {
		return nil, err
	}
	if !setting.MootaEnabled {
		return nil, errors.New("moota is disabled")
	}
	apiKey := setting.MootaAPIKey
	if apiKey == "" {
		return nil, errors.New("moota api key is not configured")
	}

	endpoint := setting.MootaEndpoint
	if endpoint == "" {
		endpoint = "https://app.moota.co"
	}
	endpoint = strings.TrimRight(endpoint, "/")

	req, err := http.NewRequest("GET", endpoint+"/api/v2/bank", nil)
	if err != nil {
		return nil, err
	}
	// Moota API v2 requires Bearer token
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Accept", "application/json")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("moota API error %d: %s", resp.StatusCode, string(body))
	}

	var banks MootaBankResponse
	if err := json.NewDecoder(resp.Body).Decode(&banks); err != nil {
		return nil, err
	}
	return &banks, nil
}
