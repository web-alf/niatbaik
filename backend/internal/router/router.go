package router

import (
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"

	"github.com/anrdart/niatbaik-api/internal/config"
	"github.com/anrdart/niatbaik-api/internal/handler"
	"github.com/anrdart/niatbaik-api/internal/middleware"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/anrdart/niatbaik-api/internal/service"
	"github.com/anrdart/niatbaik-api/pkg/realtime"
)

func Setup(e *echo.Echo, db *gorm.DB, cfg *config.Config) {
	// Initialize repositories
	userRepo := repository.NewUserRepo(db)
	campaignRepo := repository.NewCampaignRepo(db)
	categoryRepo := repository.NewCategoryRepo(db)
	invoiceRepo := repository.NewInvoiceRepo(db)
	donationRepo := repository.NewDonationRepo(db)
	settingRepo := repository.NewSettingRepo(db)
	statsRepo := repository.NewStatsRepo(db)
	withdrawalRepo := repository.NewWithdrawalRepo(db)
	trashRepo := repository.NewTrashRepo(db)
	notificationRepo := repository.NewNotificationRepo(db)
	activityRepo := repository.NewActivityRepo(db)
	fundraiserRepo := repository.NewFundraiserRepo(db)
	siteContentRepo := repository.NewSiteContentRepo(db)
	commissionRepo := repository.NewCommissionRepo(db)
	adCostRepo := repository.NewAdCostRepo(db)
	paymentMethodRepo := repository.NewPaymentMethodRepo(db)
	pageVisitRepo := repository.NewPageVisitRepo(db)
	dataStudioRepo := repository.NewDataStudioRepo(db)
	revokedTokenRepo := repository.NewRevokedTokenRepo(db)
	paymentStatusRepo := repository.NewPaymentStatusRepo(db)
	processedWebhookRepo := repository.NewProcessedWebhookRepo(db)
	trackingRepo := repository.NewTrackingRepo(db)
	trackingService := service.NewTrackingService(trackingRepo, settingRepo, cfg)

	// Initialize services
	authService := service.NewAuthService(db, cfg, revokedTokenRepo)
	paymentService := service.NewPaymentService(db, invoiceRepo, campaignRepo, settingRepo, fundraiserRepo, commissionRepo, trackingService)
	mootaService := service.NewMootaService(cfg, paymentService, invoiceRepo, settingRepo, processedWebhookRepo)
	flipService := service.NewFlipService(cfg, paymentService, invoiceRepo, settingRepo, processedWebhookRepo)
	xenditService := service.NewXenditService(cfg, paymentService, invoiceRepo, settingRepo, processedWebhookRepo)
	ipaymuService := service.NewIpaymuService(cfg, paymentService, invoiceRepo, settingRepo, processedWebhookRepo)
	duitkuService := service.NewDuitkuService(cfg, paymentService, invoiceRepo, settingRepo, processedWebhookRepo)
	donationService := service.NewDonationService(db, cfg, invoiceRepo, campaignRepo, donationRepo, settingRepo, paymentMethodRepo, flipService, mootaService, xenditService, ipaymuService, duitkuService, paymentService)
	dashboardService := service.NewDashboardService(statsRepo)
	campaignService := service.NewCampaignService(campaignRepo, categoryRepo)
	userService := service.NewUserService(userRepo, settingRepo)
	analyticsService := service.NewAnalyticsService(statsRepo, adCostRepo, pageVisitRepo)
	withdrawalService := service.NewWithdrawalService(db, withdrawalRepo)
	settingService := service.NewSettingService(settingRepo)
	siteContentService := service.NewSiteContentService(siteContentRepo)
	trashService := service.NewTrashService(trashRepo)
	notificationService := service.NewNotificationService(notificationRepo)
	profileService := service.NewProfileService(db, activityRepo)
	uploadService := service.NewUploadService(cfg.UploadDir, cfg.MaxUploadSize)
	adCostService := service.NewAdCostService(adCostRepo)
	paymentMethodService := service.NewPaymentMethodService(paymentMethodRepo)
	dataStudioService := service.NewDataStudioService(dataStudioRepo)
	cekatAIService := service.NewCekatAIService(settingRepo)

	// Initialize handlers
	authHandler := handler.NewAuthHandler(authService)
	publicHandler := handler.NewPublicHandler(campaignRepo, categoryRepo, settingRepo, invoiceRepo, donationRepo, paymentMethodRepo, pageVisitRepo, cfg)
	donationHandler := handler.NewDonationHandler(donationService)
	webhookHandler := handler.NewWebhookHandler(mootaService, flipService, xenditService, ipaymuService, duitkuService)
	dashboardHandler := handler.NewDashboardHandler(dashboardService)
	adminCampaignHandler := handler.NewAdminCampaignHandler(campaignService, campaignRepo, invoiceRepo)
	userHandler := handler.NewUserHandler(userService, userRepo)
	analyticsHandler := handler.NewAnalyticsHandler(analyticsService)
	settingHandler := handler.NewSettingHandler(settingService, mootaService)
	siteContentHandler := handler.NewSiteContentHandler(siteContentService)
	withdrawalHandler := handler.NewWithdrawalHandler(withdrawalService, withdrawalRepo)
	trashHandler := handler.NewTrashHandler(trashService)
	invoiceHandler := handler.NewInvoiceHandler(db, paymentService, paymentStatusRepo)
	fundraiserHandler := handler.NewFundraiserHandler(fundraiserRepo, commissionRepo, userRepo, userService)
	profileHandler := handler.NewProfileHandler(profileService)
	notificationHandler := handler.NewNotificationHandler(notificationService)
	uploadHandler := handler.NewUploadHandler(uploadService)
	adCostHandler := handler.NewAdCostHandler(adCostService)
	paymentMethodHandler := handler.NewPaymentMethodHandler(paymentMethodService)
	paymentStatusHandler := handler.NewPaymentStatusHandler(paymentStatusRepo)
	dataStudioHandler := handler.NewDataStudioHandler(dataStudioService)
	cekatAIHandler := handler.NewCekatAIHandler(cekatAIService)
	trackingHandler := handler.NewTrackingHandler(settingRepo, trackingRepo)

	// Realtime change notifier: a global revision is bumped after every successful
	// mutating request (RevisionBumper), and long-poll clients block on /events until
	// it advances. Drives near-instant dashboard auto-refresh without WebSockets.
	notifier := realtime.New()
	eventsHandler := handler.NewEventsHandler(notifier)

	// API group
	api := e.Group("/api")
	api.Use(middleware.RevisionBumper(notifier))

	// Health
	api.GET("/health", publicHandler.HealthCheck)

	// Public routes (no auth)
	api.GET("/campaigns", publicHandler.ListCampaigns)
	api.GET("/campaigns/:slug", publicHandler.GetCampaign)
	api.GET("/categories", publicHandler.ListCategories)
	api.GET("/settings/public", publicHandler.GetPublicSettings)
	api.GET("/site-content/public", siteContentHandler.GetPublic)
	api.GET("/payment-methods/public", publicHandler.ListPaymentMethods)
	api.GET("/payment-statuses", paymentStatusHandler.List)
	api.GET("/stats", publicHandler.GetPublicStats)
	api.POST("/track/visit", publicHandler.TrackVisit)
	// Fundraiser share-link click tracking (public share traffic; best-effort, always 200).
	api.POST("/fundraisers/ref-hit", fundraiserHandler.RefHit)
	api.POST("/donations", donationHandler.CreateDonation)
	api.GET("/donations/:invoice", donationHandler.GetPaymentStatus)
	// Public AI-CS chat (Cekat Ai). AI-first; returns handoff=true → route to human WA CS.
	api.POST("/cs/chat", cekatAIHandler.Chat)

	// Sandbox-only: simulate a successful payment so testers can advance QRIS / VA /
	// manual invoices to a paid state (Flip has a hosted link; the others don't). Mounted
	// ONLY in non-production — never expose a way to mark donations paid without real money.
	if !cfg.IsProduction() {
		api.POST("/donations/:invoice/simulate-payment", donationHandler.SimulatePayment)
	}

	// Webhooks (no auth, no CSRF)
	api.POST("/webhooks/moota", webhookHandler.HandleMoota)
	api.POST("/webhooks/flip", webhookHandler.HandleFlip)
	api.POST("/webhooks/xendit", webhookHandler.HandleXendit)
	api.POST("/webhooks/ipaymu", webhookHandler.HandleIpaymu)
	api.POST("/webhooks/duitku", webhookHandler.HandleDuitku)

	// Auth routes. Credential-guessing surfaces (login/forgot/reset) get a tight
	// per-IP rate limit to blunt brute-force and reset-spam; register is also
	// limited to curb mass signups.
	authLimiter := middleware.AuthRateLimiter()
	auth := api.Group("/auth")
	auth.POST("/login", authHandler.Login, authLimiter)
	auth.POST("/register", authHandler.Register, authLimiter)
	auth.POST("/refresh", authHandler.RefreshToken, authLimiter)
	auth.POST("/forgot-password", authHandler.ForgotPassword, authLimiter)
	auth.POST("/reset-password", authHandler.ResetPassword, authLimiter)

	// Protected routes (require JWT)
	protected := api.Group("")
	protected.Use(middleware.JWTMiddleware(cfg.JWTSecret, revokedTokenRepo, userRepo))

	// Realtime long-poll (any authenticated dashboard user).
	protected.GET("/events", eventsHandler.Poll)

	// Auth (protected)
	protected.POST("/auth/logout", authHandler.Logout)
	protected.GET("/auth/me", authHandler.Me)

	// Profile (any authenticated user)
	protected.GET("/profile", profileHandler.GetProfile)
	protected.PUT("/profile", profileHandler.UpdateProfile)
	protected.PUT("/profile/password", profileHandler.ChangePassword)
	protected.GET("/profile/activity", profileHandler.GetActivityLog)
	protected.GET("/profile/logins", profileHandler.GetLoginHistory)

	// Notifications (any authenticated user)
	protected.GET("/notifications", notificationHandler.List)
	protected.PUT("/notifications/read", notificationHandler.MarkAllRead)
	protected.PUT("/notifications/:id/read", notificationHandler.MarkRead)

	// Uploads (any authenticated user)
	protected.POST("/uploads/image", uploadHandler.UploadImage)

	// Withdrawal request (campaign owner / fundraiser)
	protected.POST("/withdrawals", withdrawalHandler.CreateRequest)

	// Dashboard (admin + cs + advertiser) — staff only, not regular donors/fundraisers
	dashboard := protected.Group("/dashboard")
	dashboard.Use(middleware.RequireRole("admin", "cs", "advertiser", "fundraiser"))
	dashboard.GET("/stats", dashboardHandler.GetStats)
	dashboard.GET("/chart/daily", dashboardHandler.GetDailyChart)
	dashboard.GET("/chart/payment-methods", dashboardHandler.GetPaymentMethodChart)
	dashboard.GET("/chart/traffic-sources", dashboardHandler.GetTrafficSourceChart)
	dashboard.GET("/recent-transactions", dashboardHandler.GetRecentTransactions)
	dashboard.GET("/campaign-earnings", dashboardHandler.GetCampaignEarnings)

	// Staff routes — campaign management is done by admin AND cs (operasional) AND
	// advertiser (per-campaign pixel/tracking). Kept off the admin-only group so the
	// nav/editor that already promise these roles access actually work (were 403'ing).
	staff := protected.Group("")
	staff.Use(middleware.RequireStaff())

	staff.GET("/admin/campaigns", adminCampaignHandler.List)
	staff.GET("/admin/campaigns/:id", adminCampaignHandler.Get)
	staff.POST("/admin/campaigns", adminCampaignHandler.Create)
	staff.PUT("/admin/campaigns/:id", adminCampaignHandler.Update)
	staff.DELETE("/admin/campaigns/:id", adminCampaignHandler.Delete)

	categoryHandler := handler.NewCategoryHandler(categoryRepo)
	// Categories are edited from the campaign editor, so any campaign-editing staff role
	// must be able to create/update/delete them too.
	staff.POST("/admin/categories", categoryHandler.Create)
	staff.PUT("/admin/categories/:id", categoryHandler.Update)
	staff.DELETE("/admin/categories/:id", categoryHandler.Delete)

	// Per-campaign info updates (the detail-page timeline). Backs the "Add Info Update"
	// admin action. Any campaign-managing staff role can post/remove them.
	campaignUpdateRepo := repository.NewCampaignUpdateRepo(db)
	campaignUpdateHandler := handler.NewCampaignUpdateHandler(campaignUpdateRepo)
	staff.GET("/admin/campaigns/:id/updates", campaignUpdateHandler.List)
	staff.POST("/admin/campaigns/:id/updates", campaignUpdateHandler.Create)
	staff.DELETE("/admin/campaigns/:id/updates/:updateId", campaignUpdateHandler.Delete)

	// Admin routes
	admin := protected.Group("")
	admin.Use(middleware.RequireAdmin())

	admin.GET("/users", userHandler.List)
	admin.POST("/users", userHandler.Create)
	admin.PUT("/users/:id", userHandler.Update)
	admin.DELETE("/users/:id", userHandler.Delete)

	admin.GET("/settings", settingHandler.Get)
	admin.PUT("/settings", settingHandler.Update)
	admin.GET("/site-content", siteContentHandler.GetAll)
	admin.PUT("/site-content/:key", siteContentHandler.Update)
	admin.POST("/settings/test-email", settingHandler.TestEmail)
	admin.GET("/settings/moota-balance", settingHandler.GetMootaBalance)
	admin.GET("/cs/cekat-ai/status", cekatAIHandler.Status)
	admin.POST("/cs/cekat-ai/test", cekatAIHandler.Test)
	admin.GET("/settings/moota-accounts", settingHandler.GetMootaGatewayAccounts)

	admin.GET("/admin/payment-methods", paymentMethodHandler.List)
	admin.POST("/admin/payment-methods", paymentMethodHandler.Create)
	admin.PUT("/admin/payment-methods/:id", paymentMethodHandler.Update)
	admin.DELETE("/admin/payment-methods/:id", paymentMethodHandler.Delete)

	admin.POST("/admin/payment-statuses", paymentStatusHandler.Create)
	admin.PUT("/admin/payment-statuses/:id", paymentStatusHandler.Update)
	admin.DELETE("/admin/payment-statuses/:id", paymentStatusHandler.Delete)

	admin.GET("/withdrawals", withdrawalHandler.List)
	admin.POST("/withdrawals/:id/approve", withdrawalHandler.Approve)
	admin.POST("/withdrawals/:id/reject", withdrawalHandler.Reject)

	admin.GET("/trash", trashHandler.List)
	admin.POST("/trash/:type/:id/restore", trashHandler.Restore)
	admin.DELETE("/trash/:type/:id", trashHandler.PermanentDelete)

	// CS routes (admin + cs)
	cs := protected.Group("")
	cs.Use(middleware.RequireCS())

	// Invoice READS are staff-wide (admin+cs+advertiser) so the Advertiser dashboard can
	// show an individual lead table too — advertisers see the same rows, just read-only.
	// MUTATIONS (status/note/quality) stay CS-only: attribution/ops belong to CS.
	staffInv := protected.Group("")
	staffInv.Use(middleware.RequireStaff())
	staffInv.GET("/invoices", invoiceHandler.List)
	staffInv.GET("/invoices/:id", invoiceHandler.GetDetail)

	cs.PUT("/invoices/:id/status", invoiceHandler.UpdateStatus)
	cs.PUT("/invoices/:id/note", invoiceHandler.AddNote)
	cs.PUT("/invoices/:id/quality", invoiceHandler.UpdateQuality)
	// Soft-delete a lead into Trash (reverses ledgers first if paid). Admin+CS only.
	cs.DELETE("/invoices/:id", invoiceHandler.Delete)

	// Fundraiser self-service: a fundraiser reads their own affiliate records + commission
	// via /fundraisers/me. On `protected` (any authed user); the handler scopes to the
	// caller. Registered before the :id param route so "me" isn't parsed as an id.
	protected.GET("/fundraisers/me", fundraiserHandler.GetMine)

	// Fundraiser management is operational — admin + cs (the FE route and nav both
	// allow CS; keeping it admin-only made the page 403 silently for CS).
	cs.GET("/fundraisers", fundraiserHandler.List)
	cs.POST("/fundraisers", fundraiserHandler.Create)
	cs.GET("/fundraisers/:id", fundraiserHandler.GetDetail)

	// Analytics (admin + advertiser)
	analytics := protected.Group("/analytics")
	analytics.Use(middleware.RequireAdvertiser())

	// Tracking-pixel health is read by the Advertiser dashboard, so it lives with the
	// other advertiser-accessible reads (was admin-only, which 403'd for advertisers).
	advertiser := protected.Group("")
	advertiser.Use(middleware.RequireAdvertiser())
	advertiser.GET("/admin/tracking/status", trackingHandler.GetStatus)

	analytics.GET("/overview", analyticsHandler.GetOverview)
	analytics.GET("/campaigns", analyticsHandler.GetCampaignPerformance)
	analytics.GET("/utm", analyticsHandler.GetUTMTracking)
	analytics.GET("/traffic", analyticsHandler.GetTrafficBreakdown)
	analytics.GET("/funnel", analyticsHandler.GetFunnel)
	analytics.POST("/ad-costs", adCostHandler.Create)
	analytics.GET("/ad-costs", adCostHandler.List)

	// Data Studio (admin + advertiser)
	ds := protected.Group("/datastudio")
	ds.Use(middleware.RequireAdvertiser())
	ds.GET("/overview", dataStudioHandler.GetOverview)
	ds.GET("/funnel", dataStudioHandler.GetFunnel)
	ds.GET("/meta", dataStudioHandler.GetMeta)
	ds.GET("/google", dataStudioHandler.GetGoogle)
	ds.GET("/tiktok", dataStudioHandler.GetTiktok)
	ds.GET("/geo", dataStudioHandler.GetGeo)
}
