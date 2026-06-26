package handler

import (
	"errors"
	"net/http"

	"github.com/anrdart/niatbaik-api/internal/dto/request"
	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/service"
	"github.com/labstack/echo/v4"
)

type SettingHandler struct {
	service      *service.SettingService
	mootaService *service.MootaService
}

func NewSettingHandler(svc *service.SettingService, mootaService *service.MootaService) *SettingHandler {
	return &SettingHandler{service: svc, mootaService: mootaService}
}

func (h *SettingHandler) Get(c echo.Context) error {
	setting, err := h.service.Get()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch settings"))
	}

	// Include gateway status (keys are json:"-" so we add status manually)
	type SettingWithGateway struct {
		*model.Setting
		MootaConfigured      bool `json:"moota_configured"`
		FlipConfigured       bool `json:"flip_configured"`
		XenditConfigured     bool `json:"xendit_configured"`
		MetaCAPITokenSet     bool `json:"meta_capi_token_set"`
		TiktokAccessTokenSet bool `json:"tiktok_access_token_set"`
	}

	resp := SettingWithGateway{
		Setting:              setting,
		MootaConfigured:      setting.MootaAPIKey != "",
		FlipConfigured:       setting.FlipSecretKey != "",
		XenditConfigured:     setting.XenditSecretKey != "",
		MetaCAPITokenSet:     setting.MetaCAPIToken != "",
		TiktokAccessTokenSet: setting.TiktokAccessToken != "",
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(resp, "success"))
}

// TestEmail sends a test email via the saved SMTP settings so an admin can verify
// the configuration without waiting for a real donation receipt to fail.
func (h *SettingHandler) TestEmail(c echo.Context) error {
	var req struct {
		To string `json:"to"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid request body"))
	}
	if err := h.service.SendTestEmail(req.To); err != nil {
		if errors.Is(err, service.ErrValidation) {
			return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse(err.Error()))
		}
		return c.JSON(http.StatusBadGateway, response.ErrorResponse(err.Error()))
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(nil, "email tes terkirim ke "+req.To))
}

func (h *SettingHandler) Update(c echo.Context) error {
	var req request.UpdateSettingRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid request body: "+err.Error()))
	}
	if err := c.Validate(&req); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse(response.ValidationMessage(err)))
	}

	if err := h.service.Update(&req); err != nil {
		if errors.Is(err, service.ErrValidation) {
			return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse(err.Error()))
		}
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to update settings"))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(nil, "settings updated"))
}

func (h *SettingHandler) GetMootaBalance(c echo.Context) error {
	res, err := h.mootaService.CheckBalance()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse(err.Error()))
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(res, "success"))
}

// GetMootaGatewayAccounts lists the admin's Moota accounts so they can pick which
// bank_account_id (bank_id) the payment-gateway create-transaction charges to.
func (h *SettingHandler) GetMootaGatewayAccounts(c echo.Context) error {
	res, err := h.mootaService.ListGatewayAccounts()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse(err.Error()))
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(res, "success"))
}
