package middleware

import (
	"net/http"
	"strings"

	jwtpkg "github.com/anrdart/niatbaik-api/pkg/jwt"
	"github.com/labstack/echo/v4"
)

func JWTMiddleware(secret string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			auth := c.Request().Header.Get("Authorization")
			if auth == "" {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "missing authorization header"})
			}

			parts := strings.SplitN(auth, " ", 2)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "bearer") {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "invalid authorization format"})
			}

			claims, err := jwtpkg.ParseToken(parts[1], secret)
			if err != nil {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "invalid or expired token"})
			}

			c.Set("user", claims)
			return next(c)
		}
	}
}

func GetUserFromContext(c echo.Context) *jwtpkg.Claims {
	user, ok := c.Get("user").(*jwtpkg.Claims)
	if !ok {
		return nil
	}
	return user
}
