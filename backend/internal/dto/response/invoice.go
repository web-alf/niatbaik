package response

import (
	"time"

	"github.com/anrdart/niatbaik-api/internal/model"
)

type InvoiceResponse struct {
	ID            string     `json:"id"`
	InvoiceNumber string     `json:"invoice_number"`
	CampaignID    string     `json:"campaign_id"`
	CampaignTitle string     `json:"campaign_title"`
	DonorName     string     `json:"donor_name"`
	DonorEmail    string     `json:"donor_email"`
	DonorPhone    string     `json:"donor_phone"`
	IsAnonymous   bool       `json:"is_anonymous"`
	Subtotal      int64      `json:"subtotal"`
	Amount        int64      `json:"amount"`
	Status        string     `json:"status"`
	IsPaid        bool       `json:"is_paid"`
	PaymentMethod string     `json:"payment_method"`
	Message       string     `json:"message"`
	CSNote        string     `json:"cs_note"`
	CSPhone       string     `json:"cs_phone"`
	CSName        string     `json:"cs_name"`
	QRUrl         string     `json:"qr_url"`
	PayCode       string     `json:"pay_code"`
	TypePayment    string    `json:"type_payment"`
	URLAlternative string    `json:"url_alternative"`
	// PaymentInstructions is a JSON snapshot of the manual bank the donor chose
	// ({bank_name, account_number, account_name, logo, unique_code}) so the
	// confirmation page shows the exact destination, not a generic org account.
	PaymentInstructions string `json:"payment_instructions"`
	UTMSource     string     `json:"utm_source"`
	UTMMedium     string     `json:"utm_medium"`
	UTMCampaign   string     `json:"utm_campaign"`
	UTMContent    string     `json:"utm_content"`
	UTMID         string     `json:"utm_id"`
	ClickID       string     `json:"click_id"`
	PaidAt        *time.Time `json:"paid_at"`
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
	// Prefer the dedicated payment_method_name column; fall back to the
	// preloaded PaymentMethod relation's bank name when available.
	pm := inv.PaymentMethodName
	if pm == "" && inv.PaymentMethod != nil {
		pm = inv.PaymentMethod.BankName
	}

	message := ""
	if inv.Message != nil {
		message = *inv.Message
	}

	return InvoiceResponse{
		ID:            inv.ID.String(),
		InvoiceNumber: inv.InvoiceNumber,
		CampaignID:    inv.CampaignID.String(),
		CampaignTitle: inv.Campaign.Title,
		DonorName:     inv.DonorName,
		DonorEmail:    inv.DonorEmail,
		DonorPhone:    inv.DonorPhone,
		IsAnonymous:   inv.IsAnonymous,
		Subtotal:      inv.Subtotal,
		Amount:        inv.Total,
		Status:        inv.Status,
		IsPaid:        inv.IsPaid,
		PaymentMethod: pm,
		Message:       message,
		CSNote:        inv.CSNote,
		CSPhone:       inv.CSPhone,
		CSName:        inv.CSName,
		QRUrl:         inv.QrURL,
		PayCode:       inv.PayCode,
		TypePayment:    inv.TypePayment,
		URLAlternative: inv.URLAlternative,
		PaymentInstructions: inv.PaymentInstructions,
		UTMSource:     inv.UTMSource,
		UTMMedium:     inv.UTMMedium,
		UTMCampaign:   inv.UTMCampaign,
		UTMContent:    inv.UTMContent,
		UTMID:         inv.UTMID,
		ClickID:       inv.ClickID,
		PaidAt:        inv.PaidAt,
		ExpiredAt:     inv.ExpiredAt,
		CreatedAt:     inv.CreatedAt,
	}
}

func ToInvoiceListResponse(invoices []model.Invoice) []InvoiceResponse {
	list := make([]InvoiceResponse, 0, len(invoices))
	for i := range invoices {
		list = append(list, ToInvoiceResponse(&invoices[i]))
	}
	return list
}

func ToPaymentStatusResponse(inv *model.Invoice) PaymentStatusResponse {
	return PaymentStatusResponse{
		InvoiceNumber: inv.InvoiceNumber,
		IsPaid:        inv.IsPaid,
		Status:        inv.Status,
		PaidAt:        inv.PaidAt,
	}
}
