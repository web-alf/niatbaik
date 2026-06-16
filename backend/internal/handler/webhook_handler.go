package handler

import (
	"encoding/json"
	"io"
	"net/http"

	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/service"
	"github.com/labstack/echo/v4"
)

type WebhookHandler struct {
	mootaService *service.MootaService
	flipService  *service.FlipService
}

func NewWebhookHandler(mootaService *service.MootaService, flipService *service.FlipService) *WebhookHandler {
	return &WebhookHandler{mootaService: mootaService, flipService: flipService}
}

func (h *WebhookHandler) HandleMoota(c echo.Context) error {
	body, err := io.ReadAll(c.Request().Body)
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("Failed to read body"))
	}

	signature := c.Request().Header.Get("X-Moota-Signature")
	ok, reason := h.mootaService.VerifySignature(body, signature)
	if !ok {
		// Distinguish a server-side config gap (no secret saved yet — common during
		// initial setup) from a real auth failure, so Moota's "Check URL" reports a
		// diagnosable status instead of a generic 401.
		if reason == "no webhook secret configured" {
			return c.JSON(http.StatusServiceUnavailable, response.ErrorResponse("Moota webhook secret belum disimpan di Settings → Payment → Moota"))
		}
		return c.JSON(http.StatusUnauthorized, response.ErrorResponse("Invalid signature: "+reason))
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
