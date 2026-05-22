package pagination

import (
	"math"
	"strconv"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type Pagination struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	TotalRows  int64 `json:"total_rows"`
	TotalPages int   `json:"total_pages"`
}

type PaginationParams struct {
	Page  int    `json:"page"`
	Limit int    `json:"limit"`
	Sort  string `json:"sort"`
}

func GetPaginationParams(c echo.Context) PaginationParams {
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

	return PaginationParams{
		Page:  page,
		Limit: limit,
		Sort:  sort,
	}
}

func Paginate(params PaginationParams, totalRows int64) Pagination {
	totalPages := int(math.Ceil(float64(totalRows) / float64(params.Limit)))

	return Pagination{
		Page:       params.Page,
		Limit:      params.Limit,
		TotalRows:  totalRows,
		TotalPages: totalPages,
	}
}

func ApplyPagination(db *gorm.DB, params PaginationParams) *gorm.DB {
	offset := (params.Page - 1) * params.Limit
	return db.Offset(offset).Limit(params.Limit).Order(params.Sort)
}
