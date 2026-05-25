package config

import "os"

type Config struct {
	DatabaseURL string
	RedisURL    string
	Port        string
	JWTSecret   string
	FrontendURL string
}

func Load() *Config {
	return &Config{
		DatabaseURL: getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/ticket_db?sslmode=disable"),
		RedisURL:    getEnv("REDIS_URL", "redis://localhost:6379"),
		Port:        getEnv("PORT", "3000"),
		JWTSecret:   getEnv("JWT_SECRET", "super-secret-key-change-in-production"),
		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:3001"),
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
