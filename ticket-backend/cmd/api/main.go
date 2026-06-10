package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/limiter"
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
	userRepo := repository.NewUserRepository(pgPool)
	eventRepo := repository.NewEventRepository(pgPool)
	ticketRepo := repository.NewTicketRepository(pgPool)
	orderRepo := repository.NewOrderRepository(pgPool)

	// Initialize services
	authService := services.NewAuthService(userRepo, redisClient, cfg.JWTSecret)
	bookingService := services.NewBookingService(eventRepo, ticketRepo, orderRepo, redisClient)
	mailService := services.NewMailService(cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPUser, cfg.SMTPPass, cfg.SMTPFrom)

	// Load event inventory into Redis
	if err := bookingService.LoadEventInventory(context.Background()); err != nil {
		log.Printf("⚠️  Warning: Failed to load inventory: %v", err)
	}

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService, mailService)
	eventHandler := handlers.NewEventHandler(bookingService)
	ticketHandler := handlers.NewTicketHandler(bookingService)
	adminHandler := handlers.NewAdminHandler(bookingService, userRepo, orderRepo)

	// Create Fiber app
	app := fiber.New(fiber.Config{
		AppName: "Ticket Booking API v1.0",
	})

	// Middleware
	app.Use(logger.New())
	app.Use(recover.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: cfg.FrontendURL,
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "service": "ticket-api"})
	})

	// API v1 routes
	v1 := app.Group("/api/v1")

	// Auth routes (public) with rate limiting
	auth := v1.Group("/auth")
	auth.Use(limiter.New(limiter.Config{
		Max:        5,
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "Too many requests, please try again later",
			})
		},
	}))
	auth.Post("/register", authHandler.Register)
	auth.Post("/login", authHandler.Login)
	auth.Post("/forgot-password", authHandler.ForgotPassword)
	auth.Post("/reset-password", authHandler.ResetPassword)

	// Event routes (public)
	events := v1.Group("/events")
	events.Get("/", eventHandler.ListEvents)
	events.Get("/:id", eventHandler.GetEvent)

	// Protected routes
	protected := v1.Group("", middleware.AuthRequired(cfg.JWTSecret))

	// Auth protected routes
	authProtected := protected.Group("/auth")
	authProtected.Get("/me", authHandler.GetProfile)
	authProtected.Put("/profile", authHandler.UpdateProfile)

	// Admin routes
	admin := protected.Group("/admin", middleware.AdminRequired())
	admin.Get("/stats", adminHandler.GetStats)
	admin.Get("/orders", adminHandler.ListAllOrders)
	admin.Get("/users", adminHandler.ListAllUsers)
	admin.Put("/users/:id/role", adminHandler.UpdateUserRole)
	admin.Get("/events", eventHandler.AdminListEvents)
	admin.Post("/events", eventHandler.CreateEvent)
	admin.Put("/events/:id", eventHandler.UpdateEvent)
	admin.Delete("/events/:id", eventHandler.DeleteEvent)

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
