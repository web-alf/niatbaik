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

func RequireAdvertiser() echo.MiddlewareFunc {
	return RequireRole("admin", "advertiser")
}
