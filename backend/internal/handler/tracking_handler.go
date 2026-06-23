package handler

import (
	"net/http"

	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/labstack/echo/v4"
)

type TrackingHandler struct {
	settingRepo  *repository.SettingRepo
	trackingRepo *repository.TrackingRepo
}

func NewTrackingHandler(settingRepo *repository.SettingRepo, trackingRepo *repository.TrackingRepo) *TrackingHandler {
	return &TrackingHandler{settingRepo: settingRepo, trackingRepo: trackingRepo}
}

// GetStatus returns per-platform pixel/connection status, driven by config + the last
// dispatch log. This is the single source of truth for the Advertiser dashboard's
// "Status Pixel" panel (replacing the hardcoded mock badges).
//
// Status rules:
//
//	not_connected : ID/token empty
//	configured    : configured AND no dispatch log yet (awaiting first paid donation)
//	error         : configured AND last dispatch failed (4xx/5xx)
//	active        : configured AND last dispatch succeeded
func (h *TrackingHandler) GetStatus(c echo.Context) error {
	settings, err := h.settingRepo.Get()
	if err != nil || settings == nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch settings"))
	}

	lastPerPlatform, _ := h.trackingRepo.LastPerPlatform()
	count24h, _ := h.trackingRepo.CountByPlatform24h()

	type plat struct {
		name            string
		idSet, tokenSet bool
		enabled         bool
	}
	// Three platforms surfaced in the dashboard. Google has no server-side CAPI, so it
	// reports client-side-only (configured when any Google ID is set; tokenSet always true).
	plats := []plat{
		{"meta", settings.MetaPixelID != "", settings.MetaCAPIToken != "", settings.MetaCAPIEnabled},
		{"google", settings.GoogleAdsConversionID != "" || settings.GA4MeasurementID != "", true, true},
		{"tiktok", settings.TiktokPixelID != "", settings.TiktokAccessToken != "", settings.TiktokEAPIEnabled},
	}

	out := make([]response.TrackingPlatformStatus, 0, len(plats))
	for _, p := range plats {
		status := response.TrackingPlatformStatus{
			Platform:       p.name,
			Configured:     p.idSet && p.tokenSet,
			Enabled:        p.enabled,
			RecentCount24h: count24h[p.name],
		}
		var lastEvent *response.TrackingLastEvent
		if last, ok := lastPerPlatform[p.name]; ok {
			lastEvent = &response.TrackingLastEvent{
				At: last.CreatedAt, Success: last.Success,
				HTTPStatus: last.HTTPStatus, Error: last.ErrorMessage, EventName: last.EventName,
			}
		}
		status.LastEvent = lastEvent
		status.Status = classifyStatus(status.Configured, lastEvent)
		out = append(out, status)
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(response.TrackingStatusResponse{Platforms: out}, "success"))
}

// classifyStatus implements the 4-state rule from the spec:
//
//	not_connected : not configured
//	configured    : configured AND no last event yet
//	error         : configured AND last event failed
//	active        : configured AND last event succeeded
func classifyStatus(configured bool, last *response.TrackingLastEvent) string {
	if !configured {
		return "not_connected"
	}
	if last == nil {
		return "configured"
	}
	if last.Success {
		return "active"
	}
	return "error"
}
