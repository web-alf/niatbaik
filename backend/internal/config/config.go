package config

import (
	"os"
	"strconv"
	"time"
)

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

	CORSOrigins string
}

func Load() *Config {
	return &Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "niatbaik"),
		DBPassword: getEnv("DB_PASSWORD", "secret"),
		DBName:     getEnv("DB_NAME", "niatbaik"),

		JWTSecret:        getEnv("JWT_SECRET", "change-me-in-production"),
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

		CORSOrigins: getEnv("CORS_ORIGINS", "http://localhost:3000"),
	}
}

func (c *Config) IsProduction() bool {
	return c.AppEnv == "production"
}

func (c *Config) DSN() string {
	return "host=" + c.DBHost +
		" user=" + c.DBUser +
		" password=" + c.DBPassword +
		" dbname=" + c.DBName +
		" port=" + c.DBPort +
		" sslmode=disable TimeZone=Asia/Jakarta"
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
