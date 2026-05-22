package handler

import (
	"net/http"

	"github.com/anrdart/niatbaik-api/internal/dto/request"
	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/middleware"
	"github.com/anrdart/niatbaik-api/internal/service"
	"github.com/labstack/echo/v4"
)

type ProfileHandler struct {
	profileService *service.ProfileService
}

func NewProfileHandler(profileService *service.ProfileService) *ProfileHandler {
	return &ProfileHandler{profileService: profileService}
}

func (h *ProfileHandler) GetProfile(c echo.Context) error {
	claims := middleware.GetUserFromContext(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, response.ErrorResponse("unauthorized"))
	}

	user, err := h.profileService.GetProfile(claims.UserID)
	if err != nil {
		return c.JSON(http.StatusNotFound, response.ErrorResponse(err.Error()))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(user, "success"))
}

func (h *ProfileHandler) UpdateProfile(c echo.Context) error {
	claims := middleware.GetUserFromContext(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, response.ErrorResponse("unauthorized"))
	}

	var req request.UpdateProfileRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid request body"))
	}

	if err := h.profileService.UpdateProfile(claims.UserID, &req); err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to update profile"))
	}

	h.profileService.LogActivity(claims.UserID, "update", "Profile updated",
		c.RealIP(), c.Request().UserAgent())

	return c.JSON(http.StatusOK, response.SuccessResponse(nil, "profile updated"))
}

func (h *ProfileHandler) ChangePassword(c echo.Context) error {
	claims := middleware.GetUserFromContext(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, response.ErrorResponse("unauthorized"))
	}

	var req request.ChangePasswordRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid request body"))
	}

	if err := h.profileService.ChangePassword(claims.UserID, &req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}

	h.profileService.LogActivity(claims.UserID, "update", "Password changed",
		c.RealIP(), c.Request().UserAgent())

	return c.JSON(http.StatusOK, response.SuccessResponse(nil, "password changed"))
}

func (h *ProfileHandler) GetActivityLog(c echo.Context) error {
	claims := middleware.GetUserFromContext(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, response.ErrorResponse("unauthorized"))
	}

	logs, err := h.profileService.GetActivityLog(claims.UserID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch activity log"))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(logs, "success"))
}

func (h *ProfileHandler) GetLoginHistory(c echo.Context) error {
	claims := middleware.GetUserFromContext(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, response.ErrorResponse("unauthorized"))
	}

	histories, err := h.profileService.GetLoginHistory(claims.UserID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch login history"))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(histories, "success"))
}
