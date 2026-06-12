package request

type CreateDonationRequest struct {
	CampaignSlug  string `json:"campaign_slug" validate:"required"`
	DonorName     string `json:"donor_name" validate:"required,min=2"`
	DonorPhone    string `json:"donor_phone" validate:"required"`
	DonorEmail    string `json:"donor_email" validate:"omitempty,email"`
	Amount        int64  `json:"amount" validate:"required,min=10000,max=1000000000"`
	Message       string `json:"message"`
	IsAnonymous   bool   `json:"is_anonymous"`
	PaymentMethod string `json:"payment_method"`
	UTMSource     string `json:"utm_source"`
	UTMMedium     string `json:"utm_medium"`
	UTMCampaign   string `json:"utm_campaign"`
	// ReferralCode is the referring fundraiser's user ID, captured from a
	// ?ref=<user_id> share link on the public donation page. When it resolves to a
	// real fundraiser, the invoice is tagged so the commission payout in
	// PaymentService.ProcessPayment credits that fundraiser once the donation is paid.
	ReferralCode string `json:"referral_code"`
}
