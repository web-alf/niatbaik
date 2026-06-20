package middleware

import (
	"net/http"
	"strings"

	"github.com/anrdart/niatbaik-api/internal/repository"
	jwtpkg "github.com/anrdart/niatbaik-api/pkg/jwt"
	"github.com/labstack/echo/v4"
)

// JWTMiddleware validates the bearer token's signature/expiry and rejects tokens
// whose JTI has been revoked (logout). The revokedRepo may be nil, in which case
// the denylist check is skipped (revocation disabled).
func JWTMiddleware(secret string, revokedRepo *repository.RevokedTokenRepo) echo.MiddlewareFunc {
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

			if revokedRepo != nil && claims.ID != "" {
				// Fail CLOSED: a DB error here must reject the request, not wave the token
				// through. Swallowing the error (the old `revoked, _ :=`) meant a transient
				// DB hiccup or connection-pool exhaustion silently accepted logged-out /
				// revoked tokens — a security control that failed open.
				revoked, err := revokedRepo.IsRevoked(claims.ID)
				if err != nil {
					return c.JSON(http.StatusUnauthorized, map[string]string{"message": "unable to verify token state"})
				}
				if revoked {
					return c.JSON(http.StatusUnauthorized, map[string]string{"message": "token has been revoked"})
				}
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
