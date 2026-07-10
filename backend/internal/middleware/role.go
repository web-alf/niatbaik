package middleware

import (
	"net/http"
	"slices"

	"github.com/labstack/echo/v4"
)

func RequireRole(roles ...string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			claims := GetUserFromContext(c)
			if claims == nil {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "unauthorized"})
			}

			if !slices.Contains(roles, claims.Role) {
				return c.JSON(http.StatusForbidden, map[string]string{"message": "insufficient permissions"})
			}

			return next(c)
		}
	}
}

func RequireAdmin() echo.MiddlewareFunc {
	return RequireRole("admin")
}

func RequireCS() echo.MiddlewareFunc {
	return RequireRole("admin", "cs")
}

// RequireAdvertiser gates the marketing/analytics surface. Fundraiser is included
// because the fundraiser panel mirrors the advertiser panel (product decision), so it
// reads the same analytics/data-studio/pixel endpoints.
func RequireAdvertiser() echo.MiddlewareFunc {
	return RequireRole("admin", "advertiser", "fundraiser")
}

// RequireStaff allows the internal staff roles plus fundraiser. Fundraiser is included
// so its advertiser-style panel can read campaigns + invoices. Used for campaign
// management: CS operates campaigns, Advertiser needs read+edit for per-campaign
// pixel/tracking config, Fundraiser mirrors advertiser access.
func RequireStaff() echo.MiddlewareFunc {
	return RequireRole("admin", "cs", "advertiser", "fundraiser")
}
