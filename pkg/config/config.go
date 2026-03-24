package config

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost                 string
	DBPort                 string
	DBUser                 string
	DBPassword             string
	DBName                 string
	JWTSecret              string
	JWTExpiration          time.Duration
	RefreshTokenExpiration time.Duration
	ServerPort             string
	SMTPHost               string
	SMTPPort               string
	SMTPUser               string
	SMTPPassword           string
	SMTPSender             string
}

func Load() (*Config, error) {
	// Load .env file if present
	_ = godotenv.Load()

	cfg := &Config{
		DBHost:       os.Getenv("DB_HOST"),
		DBPort:       os.Getenv("DB_PORT"),
		DBUser:       os.Getenv("DB_USER"),
		DBPassword:   os.Getenv("DB_PASSWORD"),
		DBName:       os.Getenv("DB_NAME"),
		JWTSecret:    os.Getenv("JWT_SECRET"),
		ServerPort:   os.Getenv("PORT"),
		SMTPHost:     strings.TrimSpace(os.Getenv("SMTP_HOST")),
		SMTPPort:     strings.TrimSpace(os.Getenv("SMTP_PORT")),
		SMTPUser:     strings.TrimSpace(os.Getenv("SMTP_USER")),
		SMTPPassword: strings.TrimSpace(os.Getenv("SMTP_PASSWORD")),
		SMTPSender:   strings.TrimSpace(os.Getenv("SMTP_SENDER")),
	}

	expStr := os.Getenv("JWT_EXPIRATION")
	if expStr == "" {
		expStr = "24h" // Default expiration
	}
	exp, err := time.ParseDuration(expStr)
	if err != nil {
		return nil, err
	}
	cfg.JWTExpiration = exp

	refreshExpStr := os.Getenv("REFRESH_TOKEN_EXPIRATION")
	if refreshExpStr == "" {
		refreshExpStr = "168h" // Default 7 days
	}
	refreshExp, err := time.ParseDuration(refreshExpStr)
	if err != nil {
		return nil, err
	}
	cfg.RefreshTokenExpiration = refreshExp

	fmt.Println("configs", cfg.SMTPPassword, cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPUser, cfg.SMTPSender)
	// Optional: check for required fields
	if cfg.DBHost == "" || cfg.DBUser == "" || cfg.DBPassword == "" || cfg.DBName == "" {
		return nil, fmt.Errorf("missing required database configuration in environment variables")
	}
	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("missing JWT_SECRET in environment variables")
	}
	return cfg, nil
}
