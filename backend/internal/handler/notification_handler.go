package handler

import (
	"net/http"
	"strconv"

	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/middleware"
	"github.com/anrdart/niatbaik-api/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type NotificationHandler struct {
	notificationService *service.NotificationService
}

func NewNotificationHandler(notificationService *service.NotificationService) *NotificationHandler {
	return &NotificationHandler{notificationService: notificationService}
}

func (h *NotificationHandler) List(c echo.Context) error {
	claims := middleware.GetUserFromContext(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, response.ErrorResponse("unauthorized"))
	}

	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	if limit <= 0 {
		limit = 20
	}

	notifications, unreadCount, err := h.notificationService.GetNotifications(claims.UserID, limit)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch notifications"))
	}

	data := map[string]interface{}{
		"notifications": notifications,
		"unread_count":  unreadCount,
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(data, "success"))
}

func (h *NotificationHandler) MarkRead(c echo.Context) error {
	claims := middleware.GetUserFromContext(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, response.ErrorResponse("unauthorized"))
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid notification id"))
	}

	if err := h.notificationService.MarkRead(id); err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to mark notification as read"))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(nil, "notification marked as read"))
}

func (h *NotificationHandler) MarkAllRead(c echo.Context) error {
	claims := middleware.GetUserFromContext(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, response.ErrorResponse("unauthorized"))
	}

	if err := h.notificationService.MarkAllRead(claims.UserID); err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to mark all notifications as read"))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(nil, "all notifications marked as read"))
}
