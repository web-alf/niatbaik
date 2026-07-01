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
//
// It also re-reads the user's role from the DB (via userRepo) and overwrites the
// role carried in the token, so authorization always reflects the current role — an
// admin changing a user's role takes effect on the user's next request instead of
// only after they log out and back in (the role was previously baked into the JWT at
// login and never refreshed). If the user no longer exists, the token stops
// authorizing (a deleted user is locked out immediately). userRepo may be nil, in
// which case the token's role is used as-is (authoritative-role check disabled).
func JWTMiddleware(secret string, revokedRepo *repository.RevokedTokenRepo, userRepo *repository.UserRepo) echo.MiddlewareFunc {
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

			// Authoritative role + credential-change check, from the DB source-of-truth.
			// Fail OPEN on a lookup error: the JWT signature is already verified, so the
			// token's own role is trustworthy — a transient DB blip (timeout, pool
			// exhaustion) must not 401 a valid admin mid-session (that bounces them to
			// /login and wipes cached data). On a SUCCESSFUL read we do enforce:
			//   (a) the live role overwrites the token's (possibly stale) role, so a role
			//       change takes effect on the next request without re-login;
			//   (b) any token issued before the user's last password change is rejected,
			//       so a password reset revokes all outstanding access/refresh tokens.
			if userRepo != nil {
				if snap, err := userRepo.AuthByID(claims.UserID); err == nil {
					claims.Role = snap.Role
					if snap.PasswordChangedAt != nil && claims.IssuedAt != nil &&
						claims.IssuedAt.Time.Before(*snap.PasswordChangedAt) {
						return c.JSON(http.StatusUnauthorized, map[string]string{"message": "token invalidated by password change"})
					}
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
