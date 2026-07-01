package main

import (
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	echoMiddleware "github.com/labstack/echo/v4/middleware"

	"github.com/anrdart/niatbaik-api/internal/config"
	"github.com/anrdart/niatbaik-api/internal/database"
	"github.com/anrdart/niatbaik-api/internal/middleware"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/anrdart/niatbaik-api/internal/router"
	"github.com/anrdart/niatbaik-api/pkg/validator"
)

func main() {
	// Load config
	cfg := config.Load()

	// Fail fast on insecure/missing production config (weak JWT secret, default
	// DB password). Better to crash on boot than to silently sign forgeable tokens.
	if err := cfg.Validate(); err != nil {
		log.Fatalf("Invalid configuration: %v", err)
	}

	// Connect database
	db, err := database.ConnectDB(cfg)
	if err != nil {
		log.Fatalf("Failed to connect database: %v", err)
	}

	// Run migrations
	if err := database.Migrate(db); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Seed default data
	database.Seed(db)

	// Background sweeper: flip unpaid invoices past their 24h window to "Kadaluarsa"
	// so stale pending donations age out instead of lingering forever. Runs once at
	// boot, then hourly. Best-effort — log on error, never crash the server.
	go func() {
		invoiceRepo := repository.NewInvoiceRepo(db)
		sweep := func() {
			if n, err := invoiceRepo.ExpireStale(); err != nil {
				log.Printf("[expiry] failed to expire stale invoices: %v", err)
			} else if n > 0 {
				log.Printf("[expiry] marked %d stale invoice(s) as Kadaluarsa", n)
			}
		}
		sweep()
		ticker := time.NewTicker(1 * time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			sweep()
		}
	}()

	// Create Echo instance
	e := echo.New()
	e.HideBanner = true
	e.Validator = validator.New()

	// Trust ONLY nginx's X-Real-IP (set to $remote_addr on every proxied request) for
	// client IP. Without this, echo's default RealIP() reads the client-supplied
	// X-Forwarded-For leftmost value, which an attacker can spoof to mint a fresh
	// rate-limit bucket per request (defeating the login/reset throttle) and to poison
	// login-history logs. nginx APPENDS to XFF, so XFF can't be trusted here; X-Real-IP
	// is the single edge-set value.
	e.IPExtractor = echo.ExtractIPFromRealIPHeader()

	// Cap request bodies to prevent memory-exhaustion DoS. File uploads have a
	// stricter per-file limit enforced in the upload service; this is the outer guard.
	e.Use(echoMiddleware.BodyLimit("12M"))

	// Global middleware
	e.Use(echoMiddleware.Logger())
	e.Use(echoMiddleware.Recover())
	e.Use(middleware.SecurityHeaders())
	e.Use(middleware.CORSMiddleware(cfg.CORSOrigins))

	// Defense-in-depth headers for uploaded files, applied via a global middleware
	// scoped by path (echo's Static has no per-route middleware hook). Uploads are
	// restricted to raster images (extension derived from sniffed content type), so
	// nosniff + a sandbox CSP neuter any active content that might slip through.
	e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			if strings.HasPrefix(c.Request().URL.Path, "/uploads/") {
				h := c.Response().Header()
				h.Set("X-Content-Type-Options", "nosniff")
				h.Set("Content-Security-Policy", "default-src 'none'; sandbox")
				// Campaign images are PUBLIC content with immutable UUID filenames, so
				// allow shared-CDN caching for a year. "private" (the old value) told
				// Cloudflare not to cache, forcing every image back to the origin —
				// the cause of slow image loads. This is the single source of truth for
				// the upload Cache-Control; nginx must NOT add its own (would duplicate).
				h.Set("Cache-Control", "public, max-age=31536000, immutable")
			}
			return next(c)
		}
	})

	// Static file serving for uploads. Use e.Static (NOT a group with an empty
	// prefix, which registered a malformed "/uploads*" route and 404'd everything).
	e.Static("/uploads", cfg.UploadDir)

	// Setup routes
	router.Setup(e, db, cfg)

	// Start server
	addr := fmt.Sprintf(":%s", cfg.AppPort)
	log.Printf("NIATBAIK API starting on %s", addr)
	if err := e.Start(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
