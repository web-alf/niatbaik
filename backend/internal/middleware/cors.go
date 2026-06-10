package middleware

import (
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	echomw "github.com/labstack/echo/v4/middleware"
)

func CORSMiddleware(origins string) echo.MiddlewareFunc {
	allowOrigins := make([]string, 0)
	hasWildcard := false
	for _, o := range strings.Split(origins, ",") {
		o = strings.TrimSpace(o)
		if o == "" {
			continue
		}
		if o == "*" {
			hasWildcard = true
		}
		allowOrigins = append(allowOrigins, o)
	}

	// Sending credentials to a wildcard origin is forbidden by the spec and would
	// leak cookies/Authorization to any site. If a wildcard is configured, disable
	// credentials so the combination can never be active.
	allowCredentials := !hasWildcard

	return echomw.CORSWithConfig(echomw.CORSConfig{
		AllowOrigins: allowOrigins,
		AllowMethods: []string{
			http.MethodGet,
			http.MethodPost,
			http.MethodPut,
			http.MethodDelete,
			http.MethodPatch,
		},
		AllowHeaders: []string{
			echo.HeaderAuthorization,
			echo.HeaderContentType,
		},
		AllowCredentials: allowCredentials,
	})
}
