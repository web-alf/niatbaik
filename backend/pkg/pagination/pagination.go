package pagination

import (
	"math"
	"strconv"
	"strings"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// DefaultSort is the safe fallback whenever the requested sort is empty or fails
// whitelist validation.
const DefaultSort = "created_at desc"

// allowedSortColumns is the whitelist of columns that may appear in an ORDER BY.
// params.Sort flows from untrusted query strings straight into gorm's .Order(),
// which does NOT parameterize it — so anything not in this set is a SQL-injection
// vector and must be rejected. Superset across campaigns/invoices/users/notifications.
var allowedSortColumns = map[string]bool{
	"created_at":          true,
	"updated_at":          true,
	"title":               true,
	"name":                true,
	"email":               true,
	"total":               true,
	"total_raised":        true,
	"target":              true,
	"status":              true,
	"amount":              true,
	"paid_at":             true,
	"invoice_number":      true,
	"donor_name":          true,
	"role":                true,
}

// SanitizeSort validates a user-supplied "column [direction]" sort clause against
// the column whitelist. Invalid input falls back to DefaultSort rather than erroring,
// preserving existing behavior for clients while closing the injection hole.
func SanitizeSort(sort string) string {
	sort = strings.TrimSpace(sort)
	if sort == "" {
		return DefaultSort
	}

	fields := strings.Fields(sort)
	if len(fields) == 0 || len(fields) > 2 {
		return DefaultSort
	}

	col := strings.ToLower(fields[0])
	if !allowedSortColumns[col] {
		return DefaultSort
	}

	dir := "asc"
	if len(fields) == 2 {
		d := strings.ToLower(fields[1])
		if d != "asc" && d != "desc" {
			return DefaultSort
		}
		dir = d
	}

	return col + " " + dir
}

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
	// Cap at 500 so admin list views (users, invoices) can load a full working set in
	// one request without page controls, while still bounding the query.
	if limit < 1 || limit > 500 {
		limit = 15
	}

	return PaginationParams{
		Page:  page,
		Limit: limit,
		Sort:  SanitizeSort(c.QueryParam("sort")),
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
	// Defense in depth: re-sanitize in case params were built without the parser.
	return db.Offset(offset).Limit(params.Limit).Order(SanitizeSort(params.Sort))
}
