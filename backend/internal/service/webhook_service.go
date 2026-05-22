package service

import (
	"fmt"
	"regexp"

	"github.com/anrdart/niatbaik-api/internal/repository"
)

type WebhookService struct {
	paymentService *PaymentService
	invoiceRepo    *repository.InvoiceRepo
}

func NewWebhookService(paymentService *PaymentService, invoiceRepo *repository.InvoiceRepo) *WebhookService {
	return &WebhookService{
		paymentService: paymentService,
		invoiceRepo:    invoiceRepo,
	}
}

func (s *WebhookService) HandleIpaymu(status string, sid string) error {
	if status != "berhasil" || sid == "" {
		return fmt.Errorf("invalid ipaymu callback: status=%s", status)
	}

	invoice, err := s.invoiceRepo.FindByPayCode(sid)
	if err != nil {
		return fmt.Errorf("invoice not found for pay_code %s: %w", sid, err)
	}

	return s.paymentService.ProcessPayment(invoice)
}

type CekmutasiPayload struct {
	Action  string `json:"action"`
	Content struct {
		Data []CekmutasiEntry `json:"data"`
	} `json:"content"`
}

type CekmutasiEntry struct {
	Amount      int64  `json:"amount"`
	Description string `json:"description"`
}

var invoiceNumberRe = regexp.MustCompile(`INV-[A-Z0-9]+`)

func (s *WebhookService) HandleCekmutasi(payload CekmutasiPayload) ([]string, error) {
	if payload.Action != "payment_report" {
		return nil, fmt.Errorf("invalid cekmutasi action: %s", payload.Action)
	}

	var processed []string

	for _, entry := range payload.Content.Data {
		matches := invoiceNumberRe.FindString(entry.Description)

		var invoiceNumber string
		if matches != "" {
			invoiceNumber = matches
		}

		var err error
		if invoiceNumber != "" {
			inv, findErr := s.invoiceRepo.FindUnpaidByInvoiceNumber(invoiceNumber)
			if findErr != nil {
				continue
			}
			err = s.paymentService.ProcessPayment(inv)
		} else {
			inv, findErr := s.invoiceRepo.FindUnpaidByAmountForUpdate(entry.Amount)
			if findErr != nil {
				continue
			}
			err = s.paymentService.ProcessPayment(inv)
		}

		if err == nil && invoiceNumber != "" {
			processed = append(processed, invoiceNumber)
		}
	}

	return processed, nil
}
