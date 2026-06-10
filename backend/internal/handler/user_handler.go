package handler

import (
	"net/http"

	"github.com/anrdart/niatbaik-api/internal/dto/request"
	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/anrdart/niatbaik-api/internal/service"
	"github.com/anrdart/niatbaik-api/pkg/pagination"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type UserHandler struct {
	service  *service.UserService
	userRepo *repository.UserRepo
}

func NewUserHandler(svc *service.UserService, repo *repository.UserRepo) *UserHandler {
	return &UserHandler{service: svc, userRepo: repo}
}

func (h *UserHandler) List(c echo.Context) error {
	params := pagination.GetPaginationParams(c)
	role := c.QueryParam("role")
	status := c.QueryParam("status")
	search := c.QueryParam("search")

	users, total, err := h.userRepo.FindAll(params, role, status, search)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch users"))
	}

	p := pagination.Paginate(params, total)
	return c.JSON(http.StatusOK, response.PaginatedResponse(users, p))
}

func (h *UserHandler) Create(c echo.Context) error {
	var req request.CreateUserRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid request body"))
	}
	if err := c.Validate(&req); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse(err.Error()))
	}

	user, err := h.service.Create(&req)
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}

	return c.JSON(http.StatusCreated, response.SuccessResponse(user, "user created"))
}

func (h *UserHandler) Update(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid user id"))
	}

	var req request.UpdateUserRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid request body"))
	}
	if err := c.Validate(&req); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse(err.Error()))
	}

	user, err := h.service.Update(id, &req)
	if err != nil {
		return c.JSON(http.StatusNotFound, response.ErrorResponse(err.Error()))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(user, "user updated"))
}

func (h *UserHandler) Delete(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid user id"))
	}

	if err := h.service.Delete(id); err != nil {
		return c.JSON(http.StatusNotFound, response.ErrorResponse(err.Error()))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(nil, "user deleted"))
}
