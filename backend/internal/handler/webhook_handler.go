package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"

	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/service"
	"github.com/labstack/echo/v4"
)

type WebhookHandler struct {
	webhookService *service.WebhookService
	mootaService   *service.MootaService
	flipService    *service.FlipService
}

func NewWebhookHandler(webhookService *service.WebhookService, mootaService *service.MootaService, flipService *service.FlipService) *WebhookHandler {
	return &WebhookHandler{webhookService: webhookService, mootaService: mootaService, flipService: flipService}
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

func (h *WebhookHandler) HandleMoota(c echo.Context) error {
	body, err := io.ReadAll(c.Request().Body)
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("Failed to read body"))
	}

	signature := c.Request().Header.Get("X-Moota-Signature")
	if !h.mootaService.VerifySignature(body, signature) {
		return c.JSON(http.StatusUnauthorized, response.ErrorResponse("Invalid signature"))
	}

	var mutations []service.MootaWebhookPayload
	if err := json.Unmarshal(body, &mutations); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("Invalid payload"))
	}

	processed, err := h.mootaService.HandleWebhook(mutations)
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"success":   true,
		"processed": processed,
	})
}

func (h *WebhookHandler) HandleFlip(c echo.Context) error {
	dataStr := c.FormValue("data")
	if dataStr == "" {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("Missing data field"))
	}

	token := c.Request().Header.Get("X-Flip-Validation")
	if !h.flipService.VerifyWebhookToken(token) {
		return c.JSON(http.StatusUnauthorized, response.ErrorResponse("Invalid token"))
	}

	var payload service.FlipWebhookPayload
	if err := json.Unmarshal([]byte(dataStr), &payload); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("Invalid payload"))
	}

	if err := h.flipService.HandleWebhook(payload); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"success": true,
	})
}
