package handler

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/anrdart/niatbaik-api/internal/config"
	"github.com/anrdart/niatbaik-api/internal/dto/request"
	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/anrdart/niatbaik-api/internal/service"
	"github.com/anrdart/niatbaik-api/pkg/pagination"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// hasManualBank reports whether at least one manual-transfer account is configured —
// either via the structured ManualBanks list OR the legacy single org account. Checks
// ParseManualBanks (not just BankNumber) so a structured-only config (legacy BankNumber
// left blank) still surfaces its accounts to donors.
func hasManualBank(s *model.Setting) bool {
	return s != nil && len(model.ParseManualBanks(s)) > 0
}

type PublicHandler struct {
	campaignRepo      *repository.CampaignRepo
	categoryRepo      *repository.CategoryRepo
	settingRepo       *repository.SettingRepo
	invoiceRepo       *repository.InvoiceRepo
	donationRepo      *repository.DonationRepo
	paymentMethodRepo *repository.PaymentMethodRepo
	pageVisitRepo     *repository.PageVisitRepo
	cfg               *config.Config
}

func NewPublicHandler(
	campaignRepo *repository.CampaignRepo,
	categoryRepo *repository.CategoryRepo,
	settingRepo *repository.SettingRepo,
	invoiceRepo *repository.InvoiceRepo,
	donationRepo *repository.DonationRepo,
	paymentMethodRepo *repository.PaymentMethodRepo,
	pageVisitRepo *repository.PageVisitRepo,
	cfg *config.Config,
) *PublicHandler {
	return &PublicHandler{
		campaignRepo:      campaignRepo,
		categoryRepo:      categoryRepo,
		settingRepo:       settingRepo,
		invoiceRepo:       invoiceRepo,
		donationRepo:      donationRepo,
		paymentMethodRepo: paymentMethodRepo,
		pageVisitRepo:     pageVisitRepo,
		cfg:               cfg,
	}
}

// TrackVisit records a public page view (landing or campaign) as a daily per-utm_source
// counter — the real "visits" signal for the analytics traffic breakdown. Unauthed,
// cheap, fire-and-forget from a sendBeacon; always returns 204 so a client never blocks
// or sees an error. utm_source defaults to "direct" when absent.
func (h *PublicHandler) TrackVisit(c echo.Context) error {
	var body struct {
		CampaignSlug string `json:"campaign_slug"`
		UTMSource    string `json:"utm_source"`
	}
	_ = c.Bind(&body) // tolerate empty/garbage body — visit tracking must never 4xx a beacon
	src := body.UTMSource
	if src == "" {
		src = "direct"
	}
	var campaignID *uuid.UUID
	if body.CampaignSlug != "" {
		if camp, err := h.campaignRepo.FindBySlugOrID(body.CampaignSlug); err == nil && camp != nil {
			campaignID = &camp.ID
		}
	}
	if h.pageVisitRepo != nil {
		_ = h.pageVisitRepo.Record(campaignID, src)
	}
	return c.NoContent(http.StatusNoContent)
}

func (h *PublicHandler) ListCampaigns(c echo.Context) error {
	params := request.ParsePaginationParams(c)
	// Only donatable (live) campaigns are public — a Draft/Pending/Selesai campaign must
	// never be listed, because donation_service would reject any donation to it with a
	// generic error ("lead ga bisa masuk"). FindAllLive filters status IN donatableStatuses.
	campaigns, total, err := h.campaignRepo.FindAllLive(params)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("Failed to fetch campaigns"))
	}

	var items []response.CampaignListItem
	for i := range campaigns {
		donorCount, _ := h.invoiceRepo.CountDonors(campaigns[i].ID)
		items = append(items, response.ToCampaignListItem(&campaigns[i], donorCount))
	}

	p := pagination.Paginate(pagination.PaginationParams{
		Page:  params.Page,
		Limit: params.Limit,
		Sort:  params.Sort,
	}, total)

	return c.JSON(http.StatusOK, response.PaginatedResponse(items, p))
}

func (h *PublicHandler) GetCampaign(c echo.Context) error {
	slug := c.Param("slug")
	// Accept either the slug (Long URL) or the UUID (Short URL /c/<id>).
	campaign, err := h.campaignRepo.FindBySlugOrID(slug)
	if err != nil {
		return c.JSON(http.StatusNotFound, response.ErrorResponse("Campaign not found"))
	}

	donorCount, _ := h.invoiceRepo.CountDonors(campaign.ID)

	// Get recent donors from paid invoices
	donations, _ := h.donationRepo.FindByCampaign(campaign.ID, 20)
	var donors []response.CampaignDonor
	for _, d := range donations {
		name := d.DonorName
		isAnon := false
		// Donor's prayer/message ("doa"). Suppressed for anonymous donations so an
		// "Anonim" entry never carries an identifying free-text note.
		msg := ""
		if d.Invoice.IsAnonymous {
			name = "Anonim"
			isAnon = true
		} else if d.Invoice.Message != nil {
			msg = *d.Invoice.Message
		}
		donors = append(donors, response.CampaignDonor{
			Name:        name,
			Amount:      d.Amount,
			IsAnonymous: isAnon,
			Message:     msg,
			CreatedAt:   d.CreatedAt,
		})
	}

	// Map updates
	var updates []response.CampaignUpdateItem
	for _, u := range campaign.Updates {
		updates = append(updates, response.CampaignUpdateItem{
			Title:     u.Title,
			Body:      u.Body,
			Image:     u.Image,
			CreatedAt: u.CreatedAt,
		})
	}

	detail := response.ToCampaignDetail(campaign, donorCount, donors, updates)
	return c.JSON(http.StatusOK, response.SuccessResponse(detail, "success"))
}

func (h *PublicHandler) ListCategories(c echo.Context) error {
	categories, err := h.categoryRepo.FindAll()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("Failed to fetch categories"))
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(categories, "success"))
}

func (h *PublicHandler) GetPublicSettings(c echo.Context) error {
	settings, err := h.settingRepo.Get()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("Failed to fetch settings"))
	}

	publicSettings := map[string]interface{}{
		"site_name":           settings.SiteName,
		"logo":                settings.Logo,
		"primary_color":       settings.PrimaryColor,
		"secondary_color":     settings.SecondaryColor,
		"theme_color":         settings.ThemeColor,
		"button_color":        settings.ButtonColor,
		"progressbar_color":   settings.ProgressbarColor,
		"font_family":         settings.FontFamily,
		"border_radius":       settings.BorderRadius,
		"description":         settings.Description,
		// Form config
		"form_fields_config":  settings.FormFieldsConfig,
		"nominal_presets":     settings.NominalPresets,
		// Public-form display styles (admin-selectable, global): font/border weight +
		// payment-method selector layout (card vs dropdown).
		"form_display_style":    settings.FormDisplayStyle,
		"payment_display_style": settings.PaymentDisplayStyle,
		"min_donation_global": settings.MinDonationGlobal,
		"anonymous_default":   settings.AnonymousDefault,
		"message_enabled":     settings.MessageEnabled,
		"social_proof_enabled": settings.SocialProofEnabled,
		"social_proof_config":  settings.SocialProofConfig,
		// Tracking (public IDs, not secrets)
		"meta_pixel_id":          settings.MetaPixelID,
		"meta_capi_enabled":      settings.MetaCAPIEnabled,
		"gtm_id":                 settings.GTMID,
		"google_ads_conversion_id":    settings.GoogleAdsConversionID,
		"google_ads_conversion_label": settings.GoogleAdsConversionLabel,
		"ga4_measurement_id":     settings.GA4MeasurementID,
		"tiktok_pixel_id":        settings.TiktokPixelID,
			"event_tracking_config":  settings.EventTrackingConfig,
			// Server-side token presence (not values) so the admin form can show
			// "tersimpan" without leaking the secret.
			"meta_capi_token_set":     settings.MetaCAPIToken != "",
			"tiktok_access_token_set": settings.TiktokAccessToken != "",
		// Contact + donor greeting / CS rotator
		"whatsapp_admin":  settings.WhatsappAdmin,
		"donor_greeting":  settings.DonorGreeting,
		"cs_contacts":     settings.CSContacts,
		"cs_rotator_mode": settings.CSRotatorMode,
		"cekat_ai_enabled": settings.CekatAIEnabled && settings.CekatAIEndpoint != "" && settings.CekatAIKey != "",
		// Manual bank-transfer destination (shown on the confirmation page when Flip
		// is off). Public, non-secret — it's the org's donation account.
		"bank_name":         settings.BankName,
		"bank_number":       settings.BankNumber,
		"bank_account_name": settings.BankAccountName,
		"flip_enabled":      settings.FlipEnabled,
		"flip_auto_redirect": settings.FlipAutoRedirect,
		// Per-channel gateway routing map + Moota-as-gateway flag, so the donor form can
		// show the right fee text per method and the confirmation page can treat a Moota
		// invoice like a Flip redirect.
		"payment_channel_gateways": settings.PaymentChannelGateways,
		"moota_gateway_enabled":    settings.MootaGatewayEnabled,
		"xendit_enabled":           settings.XenditEnabled,
		"ipaymu_enabled":           settings.IpaymuEnabled,
		"duitku_enabled":           settings.DuitkuEnabled,
		// Method-type titles/active flags so the public form can label groups the way
		// the admin configured (non-secret config; flip_code_config stays admin-only).
		"payment_method_types": settings.PaymentMethodTypes,
		// Sandbox flag: true when NOT running in production. The donor confirmation page
		// uses this to show a "Simulasikan Pembayaran (Sandbox)" button for testers, which
		// hits the non-production-only simulate-payment endpoint. Never true in prod.
		"sandbox_mode": !h.cfg.IsProduction(),
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(publicSettings, "success"))
}

func (h *PublicHandler) ListPaymentMethods(c echo.Context) error {
	// Source of truth is the admin's Payment settings (Setting row), NOT the legacy
	// payment_methods table — that table has no admin CRUD UI and ships empty, so the
	// public form used to fall back to a hardcoded string list that never matched what
	// the admin configured. Derive the list from settings so donor-facing methods stay
	// in sync:
	//   - Flip enabled (automatic gateway) → the channels Flip settles (QRIS / VA /
	//     e-wallet). Routing is decided by settings.flip_enabled, not the chosen row,
	//     so these are display-only; the donor pays on Flip's hosted page.
	//   - Flip disabled → the single manual bank-transfer account the admin entered
	//     (bank_name / bank_number / bank_account_name), reconciled via Moota.
	// Any active rows an admin added directly to payment_methods are still surfaced
	// (merged in) so manual/API-managed methods keep working.
	settings, err := h.settingRepo.Get()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("Failed to fetch payment settings"))
	}

	items := make([]map[string]interface{}, 0, 16)

	if settings != nil {
		// Per-channel gateway routing: each catalog channel is shown only when (a) its
		// method TYPE is active, (b) the channel is enabled in the Flip Code matrix, and
		// (c) its RESOLVED gateway is actually usable. service.ResolveChannelGateway maps
		// the channel → flip|moota|manual using the admin's PaymentChannelGateways map
		// (legacy default: VA→flip, QRIS/e-wallet→moota, transfer→manual) and downgrades to
		// manual when the target gateway's credentials are missing. The per-item "gateway"
		// + synthetic id prefix tell the backend (and donor UI) who settles each method.
		for _, ch := range flipChannelCatalog {
			if !methodTypeActive(settings.PaymentMethodTypes, ch.methodType) {
				continue
			}
			enabled, code := flipChannelState(settings.FlipCodeConfig, ch.key)
			if !enabled {
				continue
			}
			gw := service.ResolveChannelGateway(settings, ch.key, "")
			// "manual" channels are surfaced via the manual-bank block below (they point at
			// the org account, not a hosted gateway page). Only show hosted gateways here.
			// ResolveChannelGateway returns one of flip/moota/xendit/ipaymu/duitku/manual
			// (downgrading to "manual" when the routed gateway lacks credentials), so skip
			// exactly "manual" — an allowlist here goes stale as gateways are added (ipaymu/
			// duitku were dropped silently before this).
			if gw == "manual" {
				continue
			}
			items = append(items, map[string]interface{}{
				"id":           gw + "-" + ch.key,
				"bank_name":    ch.name,
				"bank_number":  "",
				"bank_type":    ch.typ,
				"account_name": "",
				"type":         ch.typ,
				"category":     ch.category,
				"code":         code,
				"admin_fee":    settings.AdminFee,
				"image":        "",
				"gateway":      gw,
			})
		}

		// Manual bank transfer — one donor-facing option per configured account, each with
		// its OWN number/holder/logo (structured ManualBanks). Shown whenever a manual bank
		// exists so the donor always has a fallback. The donor picks one in a dropdown.
		if hasManualBank(settings) {
			for i, b := range model.ParseManualBanks(settings) {
				items = append(items, map[string]interface{}{
					"id":           fmt.Sprintf("manual-bank-%d", i),
					"bank_name":    b.BankName,
					"bank_number":  b.AccountNumber,
					"bank_type":    "va",
					"account_name": b.AccountName,
					"type":         "va",
					"category":     "bank_transfer",
					"code":         "",
					"admin_fee":    settings.AdminFee,
					"image":        b.Logo,
					"gateway":      "manual",
				})
			}
		}
	}

	// Merge any admin-managed rows from the payment_methods table (manual/API additions),
	// de-duped by bank_name so a manually-added "BCA" doesn't double up with a Flip channel.
	seen := make(map[string]bool, len(items))
	for _, it := range items {
		if n, ok := it["bank_name"].(string); ok {
			seen[n] = true
		}
	}
	if rows, err := h.paymentMethodRepo.FindActive(); err == nil {
		for _, m := range rows {
			if seen[m.BankName] {
				continue
			}
			seen[m.BankName] = true
			items = append(items, map[string]interface{}{
				"id":           m.ID,
				"bank_name":    m.BankName,
				"bank_number":  m.BankNumber,
				"bank_type":    m.BankType,
				"account_name": m.AccountName,
				"type":         m.Type,
				"category":     m.Category,
				"code":         m.Code,
				"admin_fee":    m.AdminFee,
				"image":        m.Image,
				"gateway":      "manual", // admin-managed rows settle via manual reconcile
			})
		}
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(items, "success"))
}

func (h *PublicHandler) GetPublicStats(c echo.Context) error {
	settings, err := h.settingRepo.Get()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("Failed to fetch settings"))
	}

	totalDonors, _ := h.invoiceRepo.CountAllPaidDonors()

	statusCounts, _ := h.campaignRepo.CountByStatus()
	activeCampaigns := statusCounts["Berjalan"] + statusCounts["Running"]

	var totalCampaigns int64
	for _, count := range statusCounts {
		totalCampaigns += count
	}

	stats := map[string]interface{}{
		"total_raised":     settings.TotalMoney,
		"total_donors":     totalDonors,
		"active_campaigns": activeCampaigns,
		"total_campaigns":  totalCampaigns,
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(stats, "success"))
}

func (h *PublicHandler) HealthCheck(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
}

// ---------------------------------------------------------------------------
// Flip channel catalog + config helpers
// ---------------------------------------------------------------------------

// flipChannel describes one Flip gateway channel. The catalog mirrors the
// reference DonasiAja Flip Code matrix — Instant / VA / Transfer columns.
type flipChannel struct {
	key        string // stable key used in FlipCodeConfig JSON + as id suffix
	name       string // human label shown to donor
	typ        string // qris | va | ewallet
	category   string // qris | bank_transfer | ewallet
	methodType string // instant | va | transfer — maps to PaymentMethodTypes toggle
}

// flipChannelCatalog is the canonical list, ordered the way the public form renders.
var flipChannelCatalog = []flipChannel{
	// Instant
	{"qris", "QRIS", "qris", "qris", "instant"},
	{"gopay", "GoPay", "ewallet", "ewallet", "instant"},
	{"ovo", "OVO", "ewallet", "ewallet", "instant"},
	{"dana", "Dana", "ewallet", "ewallet", "instant"},
	{"linkaja", "LinkAja", "ewallet", "ewallet", "instant"},
	{"shopeepay", "ShopeePay", "ewallet", "ewallet", "instant"},
	{"doku", "Doku", "ewallet", "ewallet", "instant"},
	// Virtual Account
	{"bca", "BCA", "va", "bank_transfer", "va"},
	{"mandiri", "Mandiri", "va", "bank_transfer", "va"},
	{"bni", "BNI", "va", "bank_transfer", "va"},
	{"bri", "BRI", "va", "bank_transfer", "va"},
	{"bsi", "BSI", "va", "bank_transfer", "va"},
	{"muamalat", "Muamalat", "va", "bank_transfer", "va"},
	{"cimb", "CIMB Niaga", "va", "bank_transfer", "va"},
	{"danamon", "Danamon", "va", "bank_transfer", "va"},
	{"permata", "Permata", "va", "bank_transfer", "va"},
	// Transfer
	{"flip", "FLIP Transfer", "va", "bank_transfer", "transfer"},
}

// methodTypeActive checks whether a method-type toggle (instant/va/transfer) is
// active in the PaymentMethodTypes JSON config. Empty/unparseable config means
// "all active" (legacy default).
func methodTypeActive(cfgJSON, methodType string) bool {
	if cfgJSON == "" {
		return true // legacy: all types active
	}
	var cfg map[string]struct {
		Active bool `json:"active"`
	}
	if err := json.Unmarshal([]byte(cfgJSON), &cfg); err != nil {
		return true // parse error → legacy fallback
	}
	entry, ok := cfg[methodType]
	if !ok {
		return true // unknown type → allow by default
	}
	return entry.Active
}

// flipChannelState returns (enabled, code) for a single channel from the
// FlipCodeConfig JSON. Empty/unparseable config → (true, key) — legacy default
// where every channel is enabled with its catalog key as the code.
func flipChannelState(cfgJSON, key string) (bool, string) {
	if cfgJSON == "" {
		return true, key
	}
	var cfg map[string]struct {
		Enabled bool   `json:"enabled"`
		Code    string `json:"code"`
	}
	if err := json.Unmarshal([]byte(cfgJSON), &cfg); err != nil {
		return true, key
	}
	entry, ok := cfg[key]
	if !ok {
		return true, key // channel not in config → enabled with default code
	}
	code := entry.Code
	if code == "" {
		code = key
	}
	return entry.Enabled, code
}

