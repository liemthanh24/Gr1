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

	lines := strings.Split(string(data), "\n")
	var cleanSQL []string
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "--") {
			continue
		}
		cleanSQL = append(cleanSQL, line)
	}

	statements := strings.Split(strings.Join(cleanSQL, "\n"), ";")
	for _, stmt := range statements {
		stmt = strings.TrimSpace(stmt)
		if stmt == "" {
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

	pool.Exec(context.Background(), `
		DELETE FROM tickets WHERE event_id IN (
			SELECT id FROM events WHERE id NOT IN (SELECT MIN(id) FROM events GROUP BY name)
		)`)
	pool.Exec(context.Background(), `
		DELETE FROM orders WHERE event_id IN (
			SELECT id FROM events WHERE id NOT IN (SELECT MIN(id) FROM events GROUP BY name)
		)`)
	pool.Exec(context.Background(), `
		DELETE FROM events WHERE id NOT IN (
			SELECT MIN(id) FROM events GROUP BY name
		)`)
}

