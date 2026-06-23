package request

type CreateDonationRequest struct {
	CampaignSlug  string `json:"campaign_slug" validate:"required"`
	DonorName     string `json:"donor_name" validate:"required,min=2,max=120"`
	DonorPhone    string `json:"donor_phone" validate:"required,min=8,max=20"`
	DonorEmail    string `json:"donor_email" validate:"omitempty,email"`
	Amount        int64  `json:"amount" validate:"required,min=10000,max=1000000000"`
	Message       string `json:"message"`
	IsAnonymous   bool   `json:"is_anonymous"`
	// PaymentMethod is the legacy free-text method label (bank name / type). Kept for
	// backward compatibility and as a fallback when PaymentMethodID is not sent.
	PaymentMethod string `json:"payment_method"`
	// PaymentMethodID is the UUID of the chosen payment method (from
	// /payment-methods/public). When present it is the source of truth: the backend
	// looks it up to record the method on the invoice and to decide gateway routing.
	PaymentMethodID string `json:"payment_method_id"`
	UTMSource     string `json:"utm_source"`
	UTMMedium     string `json:"utm_medium"`
	UTMCampaign   string `json:"utm_campaign"`
	UTMContent    string `json:"utm_content"`
	UTMTerm       string `json:"utm_term"`
	UTMID         string `json:"utm_id"`
	// ReferralCode is the referring fundraiser's user ID, captured from a
	// ?ref=<user_id> share link on the public donation page. When it resolves to a
	// real fundraiser, the invoice is tagged so the commission payout in
	// PaymentService.ProcessPayment credits that fundraiser once the donation is paid.
	ReferralCode string `json:"referral_code"`
}
