package request

type UpdateSettingRequest struct {
	SiteName                    string `json:"site_name"`
	Email                       string `json:"email"`
	Phone                       string `json:"phone"`
	Address                     string `json:"address"`
	Description                 string `json:"description"`
	PrimaryColor                string `json:"primary_color"`
	SecondaryColor              string `json:"secondary_color"`
	AdminFee                    *int   `json:"admin_fee"`
	FundraiserCommissionPercent *int   `json:"fundraiser_commission_percent"`
	ThemeColor                  string `json:"theme_color"`
	ProgressbarColor            string `json:"progressbar_color"`
	ButtonColor                 string `json:"button_color"`
	WhatsappAdmin               string `json:"whatsapp_admin"`
	SocialproofSetting          *bool  `json:"socialproof_setting"`
	IpaymuVA                    string `json:"ipaymu_va"`
	IpaymuSecret                string `json:"ipaymu_secret"`
	IpaymuURL                   string `json:"ipaymu_url"`
	SmtpHost                    string `json:"smtp_host"`
	SmtpEmail                   string `json:"smtp_email"`
	SmtpPassword                string `json:"smtp_password"`
	SmtpPort                    *int   `json:"smtp_port"`
	PaymentProvider             string `json:"payment_provider"`
}
