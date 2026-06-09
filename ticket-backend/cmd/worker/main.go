package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/joho/godotenv"

	"ticket-backend/internal/config"
	"ticket-backend/internal/database"
	"ticket-backend/internal/repository"
	"ticket-backend/internal/services"
)

func main() {
	// Load .env file
	godotenv.Load()

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Connect to databases
	pgPool := database.NewPostgresPool(cfg.DatabaseURL)
	defer pgPool.Close()

	redisClient := database.NewRedisClient(cfg.RedisURL)
	defer redisClient.Close()

	// Initialize repositories
	orderRepo := repository.NewOrderRepository(pgPool)
	ticketRepo := repository.NewTicketRepository(pgPool)

	// Initialize worker service
	workerService := services.NewWorkerService(orderRepo, ticketRepo, redisClient)

	// Create cancellable context for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Handle OS signals
	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
		<-sigChan
		log.Println("🛑 Shutting down worker...")
		cancel()
	}()

	// Start worker
	log.Println("🏭 Queue Worker starting...")
	workerService.Run(ctx)
	log.Println("👋 Worker stopped")
}
