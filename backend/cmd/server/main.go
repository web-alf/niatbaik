package main

import (
	"fmt"
	"log"

	"github.com/labstack/echo/v4"
	echoMiddleware "github.com/labstack/echo/v4/middleware"

	"github.com/anrdart/niatbaik-api/internal/config"
	"github.com/anrdart/niatbaik-api/internal/database"
	"github.com/anrdart/niatbaik-api/internal/middleware"
	"github.com/anrdart/niatbaik-api/internal/router"
)

func main() {
	// Load config
	cfg := config.Load()

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

	// Create Echo instance
	e := echo.New()
	e.HideBanner = true

	// Global middleware
	e.Use(echoMiddleware.Logger())
	e.Use(echoMiddleware.Recover())
	e.Use(middleware.CORSMiddleware(cfg.CORSOrigins))

	// Static file serving for uploads
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
