package handler

import (
	"net/http"
	"strings"

	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/service"
	"github.com/labstack/echo/v4"
)

type WebhookHandler struct {
	webhookService *service.WebhookService
}

func NewWebhookHandler(webhookService *service.WebhookService) *WebhookHandler {
	return &WebhookHandler{webhookService: webhookService}
}

func (h *WebhookHandler) HandleIpaymu(c echo.Context) error {
	status := strings.ToLower(c.FormValue("status"))
	sid := c.FormValue("sid")

	if err := h.webhookService.HandleIpaymu(status, sid); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"success": true,
	})
}

func (h *WebhookHandler) HandleCekmutasi(c echo.Context) error {
	var payload service.CekmutasiPayload
	if err := c.Bind(&payload); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("Invalid payload"))
	}

	processed, err := h.webhookService.HandleCekmutasi(payload)
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"success":   true,
		"processed": processed,
	})
}
