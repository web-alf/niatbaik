package handler

import (
	"net/http"

	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/service"
	"github.com/labstack/echo/v4"
)

type CekatAIHandler struct {
	service *service.CekatAIService
}

func NewCekatAIHandler(svc *service.CekatAIService) *CekatAIHandler {
	return &CekatAIHandler{service: svc}
}

type cekatChatRequest struct {
	Message string                     `json:"message" validate:"required,max=2000"`
	History []service.CekatChatMessage `json:"history"`
}

// Chat is the PUBLIC donor-facing endpoint. AI-first: returns the AI reply, or
// handoff=true when the caller should route the donor to the human WhatsApp CS.
func (h *CekatAIHandler) Chat(c echo.Context) error {
	var req cekatChatRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid request"))
	}
	if err := c.Validate(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}
	// Cap history to the last 10 turns to bound tokens/cost.
	if len(req.History) > 10 {
		req.History = req.History[len(req.History)-10:]
	}
	res, err := h.service.Chat(req.History, req.Message)
	if err != nil {
		return c.JSON(http.StatusOK, response.SuccessResponse(map[string]interface{}{"handoff": true}, "handoff"))
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(res, "ok"))
}

// Status is an ADMIN endpoint: reports whether Cekat Ai is enabled/configured.
func (h *CekatAIHandler) Status(c echo.Context) error {
	return c.JSON(http.StatusOK, response.SuccessResponse(map[string]interface{}{
		"enabled": h.service.Enabled(),
	}, "ok"))
}

// Test is an ADMIN endpoint: sends a ping to verify endpoint + key work.
func (h *CekatAIHandler) Test(c echo.Context) error {
	if err := h.service.TestConnection(); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(map[string]interface{}{"ok": true}, "Koneksi Cekat Ai berhasil"))
}
