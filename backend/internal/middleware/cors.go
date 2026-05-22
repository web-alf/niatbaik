package middleware

import (
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	echomw "github.com/labstack/echo/v4/middleware"
)

func CORSMiddleware(origins string) echo.MiddlewareFunc {
	allowOrigins := strings.Split(origins, ",")
	for i := range allowOrigins {
		allowOrigins[i] = strings.TrimSpace(allowOrigins[i])
	}

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
		AllowCredentials: true,
	})
}
