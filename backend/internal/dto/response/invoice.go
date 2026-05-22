package response

import (
	"time"

	"github.com/anrdart/niatbaik-api/internal/model"
)

type InvoiceResponse struct {
	InvoiceNumber string     `json:"invoice_number"`
	CampaignTitle string     `json:"campaign_title"`
	DonorName     string     `json:"donor_name"`
	Amount        int64      `json:"amount"`
	Status        string     `json:"status"`
	IsPaid        bool       `json:"is_paid"`
	PaymentMethod string     `json:"payment_method"`
	QRUrl         string     `json:"qr_url"`
	PayCode       string     `json:"pay_code"`
	ExpiredAt     time.Time  `json:"expired_at"`
	CreatedAt     time.Time  `json:"created_at"`
}

type PaymentStatusResponse struct {
	InvoiceNumber string     `json:"invoice_number"`
	IsPaid        bool       `json:"is_paid"`
	Status        string     `json:"status"`
	PaidAt        *time.Time `json:"paid_at"`
}

func ToInvoiceResponse(inv *model.Invoice) InvoiceResponse {
	pm := ""
	if inv.PaymentMethod != nil {
		pm = inv.PaymentMethod.BankName
	}
	return InvoiceResponse{
		InvoiceNumber: inv.InvoiceNumber,
		CampaignTitle: inv.Campaign.Title,
		DonorName:     inv.DonorName,
		Amount:        inv.Total,
		Status:        inv.Status,
		IsPaid:        inv.IsPaid,
		PaymentMethod: pm,
		QRUrl:         inv.QrURL,
		PayCode:       inv.PayCode,
		ExpiredAt:     inv.ExpiredAt,
		CreatedAt:     inv.CreatedAt,
	}
}

func ToPaymentStatusResponse(inv *model.Invoice) PaymentStatusResponse {
	return PaymentStatusResponse{
		InvoiceNumber: inv.InvoiceNumber,
		IsPaid:        inv.IsPaid,
		Status:        inv.Status,
		PaidAt:        inv.PaidAt,
	}
}
