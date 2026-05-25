package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"

	"ticket-backend/internal/config"
	"ticket-backend/internal/database"
	"ticket-backend/internal/handlers"
	"ticket-backend/internal/middleware"
	"ticket-backend/internal/repository"
	"ticket-backend/internal/services"
)

func main() {
	// Load .env file (ignore error if not found - use system env)
	godotenv.Load()

	// Load configuration
	cfg := config.Load()

	// Connect to databases
	pgPool := database.NewPostgresPool(cfg.DatabaseURL)
	defer pgPool.Close()

	redisClient := database.NewRedisClient(cfg.RedisURL)
	defer redisClient.Close()

	// Initialize repositories
	userRepo := repository.NewUserRepository(pgPool)
	eventRepo := repository.NewEventRepository(pgPool)
	ticketRepo := repository.NewTicketRepository(pgPool)
	orderRepo := repository.NewOrderRepository(pgPool)

	// Initialize services
	authService := services.NewAuthService(userRepo, cfg.JWTSecret)
	bookingService := services.NewBookingService(eventRepo, ticketRepo, orderRepo, redisClient)

	// Load event inventory into Redis
	if err := bookingService.LoadEventInventory(context.Background()); err != nil {
		log.Printf("⚠️  Warning: Failed to load inventory: %v", err)
	}

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	eventHandler := handlers.NewEventHandler(bookingService)
	ticketHandler := handlers.NewTicketHandler(bookingService)

	// Create Fiber app
	app := fiber.New(fiber.Config{
		AppName: "Ticket Booking API v1.0",
	})

	// Middleware
	app.Use(logger.New())
	app.Use(recover.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: cfg.FrontendURL + ", http://localhost:3000, http://localhost:3001",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "service": "ticket-api"})
	})

	// API v1 routes
	v1 := app.Group("/api/v1")

	// Auth routes (public)
	auth := v1.Group("/auth")
	auth.Post("/register", authHandler.Register)
	auth.Post("/login", authHandler.Login)

	// Event routes (public)
	events := v1.Group("/events")
	events.Get("/", eventHandler.ListEvents)
	events.Get("/:id", eventHandler.GetEvent)

	// Protected routes
	protected := v1.Group("", middleware.AuthRequired(cfg.JWTSecret))

	// Ticket booking (protected)
	protected.Post("/tickets/book", ticketHandler.BookTicket)

	// Order routes (protected)
	protected.Get("/orders", ticketHandler.GetUserOrders)
	protected.Get("/orders/:id/status", ticketHandler.GetOrderStatus)

	// Graceful shutdown
	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
		<-sigChan
		log.Println("🛑 Shutting down API server...")
		app.Shutdown()
	}()

	// Start server
	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("🚀 API Server starting on %s", addr)
	if err := app.Listen(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
