package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/middleware"
	"github.com/anrdart/niatbaik-api/internal/service"
	"github.com/labstack/echo/v4"
)

type DashboardHandler struct {
	service *service.DashboardService
}

func NewDashboardHandler(svc *service.DashboardService) *DashboardHandler {
	return &DashboardHandler{service: svc}
}

func (h *DashboardHandler) GetStats(c echo.Context) error {
	claims := middleware.GetUserFromContext(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, response.ErrorResponse("unauthorized"))
	}

	stats, err := h.service.GetStats(claims.Role)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch stats"))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(stats, "success"))
}

func (h *DashboardHandler) GetDailyChart(c echo.Context) error {
	days, _ := strconv.Atoi(c.QueryParam("days"))
	if days < 1 || days > 365 {
		days = 30
	}

	data, err := h.service.GetDailyChart(days)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch chart data"))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(data, "success"))
}

func (h *DashboardHandler) GetPaymentMethodChart(c echo.Context) error {
	data, err := h.service.GetPaymentMethodChart()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch payment methods"))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(data, "success"))
}

func (h *DashboardHandler) GetTrafficSourceChart(c echo.Context) error {
	data, err := h.service.GetTrafficSourceChart()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch traffic sources"))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(data, "success"))
}

func (h *DashboardHandler) GetRecentTransactions(c echo.Context) error {
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	if limit < 1 || limit > 1000 {
		limit = 10
	}

	data, err := h.service.GetRecentTransactions(limit)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch recent transactions"))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(data, "success"))
}

// GetCampaignEarnings returns per-campaign earnings within an optional date window.
// Query params from/to are RFC3339 or YYYY-MM-DD; empty = all-time.
func (h *DashboardHandler) GetCampaignEarnings(c echo.Context) error {
	parse := func(q string, endOfDay bool) time.Time {
		q = c.QueryParam(q)
		if q == "" {
			return time.Time{}
		}
		if t, err := time.Parse(time.RFC3339, q); err == nil {
			return t
		}
		if t, err := time.Parse("2006-01-02", q); err == nil {
			if endOfDay {
				return t.Add(24*time.Hour - time.Second)
			}
			return t
		}
		return time.Time{}
	}
	from := parse("from", false)
	to := parse("to", true)

	data, err := h.service.GetCampaignEarnings(from, to)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch campaign earnings"))
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(data, "success"))
}
