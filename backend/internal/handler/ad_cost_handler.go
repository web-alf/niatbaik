package handler

import (
	"net/http"
	"time"

	"github.com/anrdart/niatbaik-api/internal/dto/request"
	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/service"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type AdCostHandler struct {
	service *service.AdCostService
}

func NewAdCostHandler(svc *service.AdCostService) *AdCostHandler {
	return &AdCostHandler{service: svc}
}

func (h *AdCostHandler) Create(c echo.Context) error {
	var req request.CreateAdCostRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid request"))
	}

	token := c.Get("user").(*jwt.Token)
	claims := token.Claims.(jwt.MapClaims)
	userID, _ := uuid.Parse(claims["user_id"].(string))

	cost, err := h.service.Create(&req, userID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to create ad cost"))
	}
	return c.JSON(http.StatusCreated, response.SuccessResponse(cost, "ad cost created"))
}

func (h *AdCostHandler) List(c echo.Context) error {
	platform := c.QueryParam("platform")
	fromStr := c.QueryParam("from")
	toStr := c.QueryParam("to")

	from := time.Now().AddDate(0, -1, 0)
	to := time.Now()
	if fromStr != "" {
		if t, err := time.Parse("2006-01-02", fromStr); err == nil {
			from = t
		}
	}
	if toStr != "" {
		if t, err := time.Parse("2006-01-02", toStr); err == nil {
			to = t
		}
	}

	costs, err := h.service.List(platform, from, to)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch ad costs"))
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(costs, "success"))
}
