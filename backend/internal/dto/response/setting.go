package response

import "github.com/anrdart/niatbaik-api/internal/model"

type AdminSettingResponse struct {
	*model.Setting
	GoogleAdsCustomerID                string `json:"google_ads_customer_id"`
	GoogleAdsLoginCustomerID           string `json:"google_ads_login_customer_id"`
	GoogleAdsDefaultConversionActionID string `json:"google_ads_default_conversion_action_id"`
	GoogleAdsServerUploadEnabled       bool   `json:"google_ads_server_upload_enabled"`
	GoogleAdsCredentialsConfigured     bool   `json:"google_ads_credentials_configured"`
}

func NewAdminSettingResponse(setting *model.Setting, credentials bool) AdminSettingResponse {
	return AdminSettingResponse{Setting: setting, GoogleAdsCustomerID: setting.GoogleAdsCustomerID, GoogleAdsLoginCustomerID: setting.GoogleAdsLoginCustomerID, GoogleAdsDefaultConversionActionID: setting.GoogleAdsDefaultConversionActionID, GoogleAdsServerUploadEnabled: setting.GoogleAdsServerUploadEnabled, GoogleAdsCredentialsConfigured: credentials}
}
