package handler

import (
	"net/http"

	"github.com/anrdart/niatbaik-api/internal/dto/request"
	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/service"
	"github.com/labstack/echo/v4"
)

type SettingHandler struct {
	service *service.SettingService
}

func NewSettingHandler(svc *service.SettingService) *SettingHandler {
	return &SettingHandler{service: svc}
}

func (h *SettingHandler) Get(c echo.Context) error {
	setting, err := h.service.Get()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch settings"))
	}

	// Include gateway status (keys are json:"-" so we add status manually)
	type SettingWithGateway struct {
		*model.Setting
		MootaConfigured bool `json:"moota_configured"`
		FlipConfigured  bool `json:"flip_configured"`
	}

	resp := SettingWithGateway{
		Setting:         setting,
		MootaConfigured: setting.MootaAPIKey != "",
		FlipConfigured:  setting.FlipSecretKey != "",
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(resp, "success"))
}

func (h *SettingHandler) Update(c echo.Context) error {
	var req request.UpdateSettingRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid request body: "+err.Error()))
	}

	if err := h.service.Update(&req); err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to update settings"))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(nil, "settings updated"))
}
