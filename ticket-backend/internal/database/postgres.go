package database

import (
	"context"
	"fmt"
	"log"

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
	return pool
}
