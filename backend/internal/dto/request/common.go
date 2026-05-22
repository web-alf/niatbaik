package request

import (
	"strconv"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type PaginationParams struct {
	Page       int       `json:"page"`
	Limit      int       `json:"limit"`
	Sort       string    `json:"sort"`
	Search     string    `json:"search"`
	Status     string    `json:"status"`
	CategoryID uuid.UUID `json:"category_id"`
}

func ParsePaginationParams(c echo.Context) PaginationParams {
	page, _ := strconv.Atoi(c.QueryParam("page"))
	if page < 1 {
		page = 1
	}

	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	if limit < 1 || limit > 100 {
		limit = 15
	}

	sort := c.QueryParam("sort")
	if sort == "" {
		sort = "created_at desc"
	}

	var categoryID uuid.UUID
	if cid := c.QueryParam("category_id"); cid != "" {
		categoryID, _ = uuid.Parse(cid)
	}

	return PaginationParams{
		Page:       page,
		Limit:      limit,
		Sort:       sort,
		Search:     c.QueryParam("search"),
		Status:     c.QueryParam("status"),
		CategoryID: categoryID,
	}
}
