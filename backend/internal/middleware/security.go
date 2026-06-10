package middleware

import "github.com/labstack/echo/v4"

// SecurityHeaders sets defensive HTTP response headers on every API response.
// The API serves JSON (not HTML), so these primarily harden against clickjacking,
// MIME sniffing, referrer leakage, and accidental caching of authenticated data
// on shared machines or intermediary proxies.
func SecurityHeaders() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			h := c.Response().Header()
			h.Set("X-Content-Type-Options", "nosniff")
			h.Set("X-Frame-Options", "DENY")
			h.Set("Referrer-Policy", "no-referrer")
			// Authenticated JSON responses must never be cached by browsers/proxies.
			h.Set("Cache-Control", "no-store")
			return next(c)
		}
	}
}
