package middleware

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	echomw "github.com/labstack/echo/v4/middleware"
	"golang.org/x/time/rate"
)

// AuthRateLimiter throttles credential-sensitive auth endpoints per client IP to
// slow brute-force / enumeration / reset-spam. Uses an in-memory token bucket:
// ~10 requests/minute sustained with a small burst. Expired visitor entries are
// evicted automatically.
func AuthRateLimiter() echo.MiddlewareFunc {
	cfg := echomw.RateLimiterConfig{
		Store: echomw.NewRateLimiterMemoryStoreWithConfig(
			echomw.RateLimiterMemoryStoreConfig{
				Rate:      rate.Every(6 * time.Second), // ~10 req/min sustained
				Burst:     5,
				ExpiresIn: 10 * time.Minute,
			},
		),
		IdentifierExtractor: func(c echo.Context) (string, error) {
			return c.RealIP(), nil
		},
		ErrorHandler: func(c echo.Context, err error) error {
			return c.JSON(http.StatusForbidden, map[string]string{"message": "rate limit error"})
		},
		DenyHandler: func(c echo.Context, identifier string, err error) error {
			return c.JSON(http.StatusTooManyRequests, map[string]string{
				"message": "terlalu banyak percobaan, coba lagi nanti",
			})
		},
	}
	return echomw.RateLimiterWithConfig(cfg)
}
