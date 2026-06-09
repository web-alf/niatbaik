package handler

import (
	"net/http"
	"strings"

	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/anrdart/niatbaik-api/pkg/slug"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type CategoryHandler struct {
	categoryRepo *repository.CategoryRepo
}

func NewCategoryHandler(categoryRepo *repository.CategoryRepo) *CategoryHandler {
	return &CategoryHandler{categoryRepo: categoryRepo}
}

type categoryInput struct {
	Name  string `json:"name"`
	Image string `json:"image"`
}

func (h *CategoryHandler) Create(c echo.Context) error {
	var req categoryInput
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid request body"))
	}
	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse("nama kategori wajib diisi"))
	}

	cat := model.Category{
		Name:  req.Name,
		Slug:  slug.GenerateUnique(req.Name, h.categoryRepo.SlugExists),
		Image: req.Image,
	}
	if err := h.categoryRepo.Create(&cat); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}
	return c.JSON(http.StatusCreated, response.SuccessResponse(cat, "category created"))
}

func (h *CategoryHandler) Update(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid category id"))
	}

	cat, err := h.categoryRepo.FindByID(id)
	if err != nil {
		return c.JSON(http.StatusNotFound, response.ErrorResponse("category not found"))
	}

	var req categoryInput
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid request body"))
	}

	req.Name = strings.TrimSpace(req.Name)
	if req.Name != "" && req.Name != cat.Name {
		cat.Name = req.Name
		categoryID := cat.ID
		cat.Slug = slug.GenerateUnique(req.Name, func(candidate string) bool {
			found, findErr := h.categoryRepo.FindBySlug(candidate)
			if findErr != nil {
				return false
			}
			return found.ID != categoryID
		})
	}
	if req.Image != "" {
		cat.Image = req.Image
	}

	if err := h.categoryRepo.Update(cat); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(cat, "category updated"))
}

func (h *CategoryHandler) Delete(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid category id"))
	}
	if _, err := h.categoryRepo.FindByID(id); err != nil {
		return c.JSON(http.StatusNotFound, response.ErrorResponse("category not found"))
	}
	if err := h.categoryRepo.Delete(id); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(nil, "category deleted"))
}
