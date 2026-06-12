package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

// insecureJWTDefault is the historical fallback secret. Kept named so Validate()
// can reject it explicitly when running in production.
const insecureJWTDefault = "change-me-in-production"

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string

	JWTSecret       string
	JWTExpiry       time.Duration
	JWTRefreshExpiry time.Duration

	AppPort string
	AppEnv  string

	UploadDir     string
	MaxUploadSize int64

	IpaymuVA           string
	IpaymuSecret       string
	IpaymuURL          string
	IpaymuMerchantCode string

	MootaAPIKey        string
	MootaWebhookSecret string

	FlipSecretKey       string
	FlipValidationToken string
	FlipBaseURL         string

	CORSOrigins string

	// FrontendBaseURL is the public site origin used to build links in outbound
	// emails (password reset, welcome). Configurable so non-production / custom-domain
	// deploys don't hardcode the donasi.niatbaik.org production host.
	FrontendBaseURL string
}

func Load() *Config {
	return &Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "niatbaik"),
		DBPassword: getEnv("DB_PASSWORD", "secret"),
		DBName:     getEnv("DB_NAME", "niatbaik"),

		JWTSecret:        getEnv("JWT_SECRET", insecureJWTDefault),
		JWTExpiry:        getDuration("JWT_EXPIRY", 24*time.Hour),
		JWTRefreshExpiry: getDuration("JWT_REFRESH_EXPIRY", 168*time.Hour),

		AppPort: getEnv("APP_PORT", "8080"),
		AppEnv:  getEnv("APP_ENV", "development"),

		UploadDir:     getEnv("UPLOAD_DIR", "./uploads"),
		MaxUploadSize: getInt64("MAX_UPLOAD_SIZE", 10<<20), // 10MB

		IpaymuVA:           getEnv("IPAYMU_VA", ""),
		IpaymuSecret:       getEnv("IPAYMU_SECRET", ""),
		IpaymuURL:          getEnv("IPAYMU_URL", ""),
		IpaymuMerchantCode: getEnv("IPAYMU_MERCHANT_CODE", ""),

		MootaAPIKey:        getEnv("MOOTA_API_KEY", ""),
		MootaWebhookSecret: getEnv("MOOTA_WEBHOOK_SECRET", ""),

		FlipSecretKey:       getEnv("FLIP_SECRET_KEY", ""),
		FlipValidationToken: getEnv("FLIP_VALIDATION_TOKEN", ""),
		FlipBaseURL:         getEnv("FLIP_BASE_URL", "https://bigflip.id/api/v3"),

		CORSOrigins: getEnv("CORS_ORIGINS", "http://localhost:3000"),

		FrontendBaseURL: strings.TrimRight(getEnv("FRONTEND_BASE_URL", "https://donasi.niatbaik.org"), "/"),
	}
}

func (c *Config) IsProduction() bool {
	return c.AppEnv == "production"
}

// Validate enforces security-critical invariants. In production it refuses to
// start with a missing/weak/default JWT secret or a default DB password, so a
// misconfigured deploy fails loudly instead of silently signing forgeable tokens.
func (c *Config) Validate() error {
	if !c.IsProduction() {
		return nil
	}
	if c.JWTSecret == "" || c.JWTSecret == insecureJWTDefault {
		return fmt.Errorf("JWT_SECRET must be set to a strong secret in production (the default %q is not allowed)", insecureJWTDefault)
	}
	if len(c.JWTSecret) < 32 {
		return fmt.Errorf("JWT_SECRET must be at least 32 characters in production (got %d)", len(c.JWTSecret))
	}
	if c.DBPassword == "" || c.DBPassword == "secret" {
		return fmt.Errorf("DB_PASSWORD must be set to a strong value in production (the default \"secret\" is not allowed)")
	}
	return nil
}

// sslMode returns the Postgres sslmode for the DSN. Production requires TLS;
// development keeps it disabled for local Docker convenience.
func (c *Config) sslMode() string {
	if c.IsProduction() {
		if v := os.Getenv("DB_SSLMODE"); v != "" {
			return v
		}
		return "require"
	}
	return "disable"
}

func (c *Config) DSN() string {
	return "host=" + c.DBHost +
		" user=" + c.DBUser +
		" password=" + c.DBPassword +
		" dbname=" + c.DBName +
		" port=" + c.DBPort +
		" sslmode=" + c.sslMode() + " TimeZone=Asia/Jakarta"
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getDuration(key string, fallback time.Duration) time.Duration {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	d, err := time.ParseDuration(v)
	if err != nil {
		return fallback
	}
	return d
}

func getInt64(key string, fallback int64) int64 {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	n, err := strconv.ParseInt(v, 10, 64)
	if err != nil {
		return fallback
	}
	return n
}
