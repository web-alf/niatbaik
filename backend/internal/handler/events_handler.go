package handler

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/anrdart/niatbaik-api/pkg/realtime"
	"github.com/labstack/echo/v4"
)

type EventsHandler struct {
	notifier *realtime.Notifier
}

func NewEventsHandler(n *realtime.Notifier) *EventsHandler {
	return &EventsHandler{notifier: n}
}

// longPollTimeout is kept well under Cloudflare's ~100s proxy idle limit so the
// connection returns cleanly and the client immediately re-polls.
const longPollTimeout = 25 * time.Second

// Poll is a long-poll endpoint. The client passes ?since=<lastRevision>; the request
// blocks until the global data revision advances past it, then returns the new
// revision. On timeout it returns the current revision with changed=false so the
// client simply re-polls. This gives push-grade latency over plain HTTP (works
// through Cloudflare, sends the JWT via the normal Authorization header).
func (h *EventsHandler) Poll(c echo.Context) error {
	since, _ := strconv.ParseUint(c.QueryParam("since"), 10, 64)

	ctx, cancel := context.WithTimeout(c.Request().Context(), longPollTimeout)
	defer cancel()

	rev, changed := h.notifier.Wait(ctx, since)
	return c.JSON(http.StatusOK, map[string]interface{}{
		"revision": rev,
		"changed":  changed,
	})
}
