package config

import (
	"strings"
	"testing"
)

func base(env string) *Config {
	return &Config{
		AppEnv:     env,
		JWTSecret:  strings.Repeat("a", 40), // strong-enough by length
		DBPassword: "a-real-password",
	}
}

func TestValidate_DevAlwaysPasses(t *testing.T) {
	c := &Config{AppEnv: "development", JWTSecret: insecureJWTDefault, DBPassword: "secret"}
	if err := c.Validate(); err != nil {
		t.Fatalf("dev config should never fail validation, got: %v", err)
	}
}

func TestValidate_ProdRejectsWeakSecrets(t *testing.T) {
	cases := []struct {
		name   string
		mutate func(*Config)
	}{
		{"default jwt secret", func(c *Config) { c.JWTSecret = insecureJWTDefault }},
		{"empty jwt secret", func(c *Config) { c.JWTSecret = "" }},
		{"short jwt secret", func(c *Config) { c.JWTSecret = "tooshort" }},
		{"default db password", func(c *Config) { c.DBPassword = "secret" }},
		{"empty db password", func(c *Config) { c.DBPassword = "" }},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			c := base("production")
			tc.mutate(c)
			if err := c.Validate(); err == nil {
				t.Errorf("expected production validation to fail for %s", tc.name)
			}
		})
	}
}

func TestValidate_ProdAcceptsStrongConfig(t *testing.T) {
	if err := base("production").Validate(); err != nil {
		t.Fatalf("strong production config should pass, got: %v", err)
	}
}

func TestDSN_SSLModeByEnv(t *testing.T) {
	t.Setenv("DB_SSLMODE", "") // ensure no override leaks in
	dev := base("development").DSN()
	if !strings.Contains(dev, "sslmode=disable") {
		t.Errorf("dev DSN should use sslmode=disable, got: %s", dev)
	}
	prod := base("production").DSN()
	if !strings.Contains(prod, "sslmode=require") {
		t.Errorf("prod DSN should use sslmode=require, got: %s", prod)
	}
}

func TestDSN_SSLModeEnvOverride(t *testing.T) {
	t.Setenv("DB_SSLMODE", "verify-full")
	prod := base("production").DSN()
	if !strings.Contains(prod, "sslmode=verify-full") {
		t.Errorf("prod DSN should honor DB_SSLMODE override, got: %s", prod)
	}
}
