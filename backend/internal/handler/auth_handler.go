package handler

import (
	"net/http"
	"strings"

	"github.com/anrdart/niatbaik-api/internal/dto/request"
	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/middleware"
	"github.com/anrdart/niatbaik-api/internal/service"
	"github.com/labstack/echo/v4"
)

type AuthHandler struct {
	service *service.AuthService
}

func NewAuthHandler(svc *service.AuthService) *AuthHandler {
	return &AuthHandler{service: svc}
}

func (h *AuthHandler) Login(c echo.Context) error {
	var req request.LoginRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid request body"))
	}
	if err := c.Validate(&req); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse(response.ValidationMessage(err)))
	}

	ip := c.RealIP()
	ua := c.Request().UserAgent()

	tokenResp, userResp, err := h.service.Login(req.Email, req.Password, ip, ua)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, response.ErrorResponse(err.Error()))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(map[string]interface{}{
		"token": tokenResp,
		"user":  userResp,
	}, "login successful"))
}

func (h *AuthHandler) Register(c echo.Context) error {
	var req request.RegisterRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid request body"))
	}
	if err := c.Validate(&req); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse(response.ValidationMessage(err)))
	}

	userResp, err := h.service.Register(&req)
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}

	return c.JSON(http.StatusCreated, response.SuccessResponse(userResp, "registration successful"))
}

func (h *AuthHandler) RefreshToken(c echo.Context) error {
	var body struct {
		RefreshToken string `json:"refresh_token" validate:"required"`
	}
	if err := c.Bind(&body); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid request body"))
	}
	if body.RefreshToken == "" {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("refresh_token is required"))
	}

	tokenResp, err := h.service.RefreshToken(body.RefreshToken)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, response.ErrorResponse(err.Error()))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(tokenResp, "token refreshed"))
}

func (h *AuthHandler) Logout(c echo.Context) error {
	claims := middleware.GetUserFromContext(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, response.ErrorResponse("unauthorized"))
	}

	// Pull the access token from the Authorization header and the (optional)
	// refresh token from the body, then revoke both server-side. The service only
	// revokes tokens belonging to this authenticated user.
	var accessToken string
	auth := c.Request().Header.Get("Authorization")
	if parts := strings.SplitN(auth, " ", 2); len(parts) == 2 && strings.EqualFold(parts[0], "bearer") {
		accessToken = parts[1]
	}

	var body struct {
		RefreshToken string `json:"refresh_token"`
	}
	_ = c.Bind(&body)

	if err := h.service.Logout(claims.UserID, accessToken, body.RefreshToken); err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to logout"))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(nil, "logged out successfully"))
}

func (h *AuthHandler) ForgotPassword(c echo.Context) error {
	var req request.ForgotPasswordRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid request body"))
	}
	if err := c.Validate(&req); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse(response.ValidationMessage(err)))
	}

	if err := h.service.ForgotPassword(req.Email); err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to process request"))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(nil, "if the email exists, a reset link has been sent"))
}

func (h *AuthHandler) ResetPassword(c echo.Context) error {
	var req request.ResetPasswordRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid request body"))
	}
	if err := c.Validate(&req); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse(response.ValidationMessage(err)))
	}

	if err := h.service.ResetPassword(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(nil, "password reset successful"))
}

func (h *AuthHandler) Me(c echo.Context) error {
	claims := middleware.GetUserFromContext(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, response.ErrorResponse("unauthorized"))
	}

	userResp, err := h.service.GetUserByID(claims.UserID)
	if err != nil {
		return c.JSON(http.StatusNotFound, response.ErrorResponse(err.Error()))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(userResp, "success"))
}
