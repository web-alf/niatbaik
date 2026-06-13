package middleware

import (
	"net/http"

	"github.com/anrdart/niatbaik-api/pkg/realtime"
	"github.com/labstack/echo/v4"
)

// RevisionBumper bumps the global change revision after any successful mutating
// request (POST/PUT/PATCH/DELETE) so long-poll clients are woken to refetch. This is
// a single chokepoint — no per-handler wiring — and covers every data change
// (campaigns, donations, invoices, settings, users, …).
//
// Skips the long-poll endpoint itself and webhook callbacks are intentionally
// INCLUDED (a paid-invoice webhook is exactly the kind of change dashboards want).
func RevisionBumper(n *realtime.Notifier) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			err := next(c)

			method := c.Request().Method
			isMutation := method == http.MethodPost || method == http.MethodPut ||
				method == http.MethodPatch || method == http.MethodDelete
			if !isMutation {
				return err
			}
			// Only bump on a successful response (2xx). c.Response().Status is set by
			// the handler via c.JSON(...).
			if status := c.Response().Status; status >= 200 && status < 300 {
				n.Bump()
			}
			return err
		}
	}
}
