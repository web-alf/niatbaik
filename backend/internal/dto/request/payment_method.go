package request

type PaymentMethodInput struct {
	BankName      string `json:"bank_name" validate:"required"`
	AccountName   string `json:"account_name"`
	BankNumber    string `json:"bank_number"`
	BankType      string `json:"bank_type"`
	Type          string `json:"type" validate:"required"` // va/ewallet/qris/card
	Category      string `json:"category"`
	Code          string `json:"code"`
	AdminFee      int    `json:"admin_fee"`
	Active        bool   `json:"active"`
	GatewayConfig string `json:"gateway_config"`
}
