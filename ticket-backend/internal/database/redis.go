package database

import (
	"context"
	"fmt"
	"log"

	"github.com/redis/go-redis/v9"
)

func NewRedisClient(redisURL string) *redis.Client {
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Fatalf("Unable to parse Redis URL: %v", err)
	}

	client := redis.NewClient(opt)

	if err := client.Ping(context.Background()).Err(); err != nil {
		log.Fatalf("Unable to ping Redis: %v", err)
	}

	fmt.Println("✅ Connected to Redis")
	return client
}
