package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

func NewPostgresPool(databaseURL string) *pgxpool.Pool {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		log.Fatalf("Unable to parse database URL: %v", err)
	}

	config.MaxConns = 20
	config.MinConns = 5

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		log.Fatalf("Unable to create connection pool: %v", err)
	}

	if err := pool.Ping(context.Background()); err != nil {
		log.Fatalf("Unable to ping database: %v", err)
	}

	fmt.Println("✅ Connected to PostgreSQL")
	runMigrations(pool)
	return pool
}

func runMigrations(pool *pgxpool.Pool) {
	data, err := os.ReadFile("migrations/001_init.sql")
	if err != nil {
		log.Printf("⚠️  Migration file not found: %v", err)
		return
	}

	statements := strings.Split(string(data), ";")
	for _, stmt := range statements {
		stmt = strings.TrimSpace(stmt)
		if stmt == "" || strings.HasPrefix(stmt, "--") {
			continue
		}
		_, err := pool.Exec(context.Background(), stmt)
		if err != nil {
			if strings.Contains(err.Error(), "already exists") ||
				strings.Contains(err.Error(), "duplicate key") {
				continue
			}
			log.Printf("⚠️  Migration warning: %v", err)
		}
	}
}
