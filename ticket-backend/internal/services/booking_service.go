package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/redis/go-redis/v9"
	"ticket-backend/internal/models"
	"ticket-backend/internal/repository"
)

type BookingService struct {
	eventRepo  *repository.EventRepository
	ticketRepo *repository.TicketRepository
	orderRepo  *repository.OrderRepository
	redisClient *redis.Client
}

func NewBookingService(
	eventRepo *repository.EventRepository,
	ticketRepo *repository.TicketRepository,
	orderRepo *repository.OrderRepository,
	redisClient *redis.Client,
) *BookingService {
	return &BookingService{
		eventRepo:   eventRepo,
		ticketRepo:  ticketRepo,
		orderRepo:   orderRepo,
		redisClient: redisClient,
	}
}

// LoadEventInventory loads ticket counts from DB into Redis
func (s *BookingService) LoadEventInventory(ctx context.Context) error {
	events, err := s.eventRepo.FindAll(ctx)
	if err != nil {
		return fmt.Errorf("failed to load events: %w", err)
	}

	for _, event := range events {
		key := fmt.Sprintf("event:%d:tickets", event.ID)
		s.redisClient.Set(ctx, key, event.AvailableTickets, 0)
		log.Printf("📦 Loaded inventory: %s → %d tickets", event.Name, event.AvailableTickets)
	}

	return nil
}

// BookTicket handles the async booking flow: Redis DECR → Create pending order → Push to queue
func (s *BookingService) BookTicket(ctx context.Context, userID int, req models.BookingRequest) (*models.BookingResponse, error) {
	// Step 1: Atomic DECR on Redis
	key := fmt.Sprintf("event:%d:tickets", req.EventID)
	remaining, err := s.redisClient.Decr(ctx, key).Result()
	if err != nil {
		return nil, fmt.Errorf("redis error: %w", err)
	}

	// If no tickets left, rollback and return error
	if remaining < 0 {
		s.redisClient.Incr(ctx, key) // rollback
		return nil, fmt.Errorf("sold out")
	}

	// Step 2: Create pending order in DB
	order, err := s.orderRepo.CreatePending(ctx, userID, req.EventID, req.SeatCode)
	if err != nil {
		s.redisClient.Incr(ctx, key) // rollback Redis
		return nil, fmt.Errorf("failed to create order: %w", err)
	}

	// Step 3: Push to Redis queue
	msg := models.BookingMessage{
		OrderID:  order.ID,
		UserID:   userID,
		EventID:  req.EventID,
		SeatCode: req.SeatCode,
	}
	msgJSON, err := json.Marshal(msg)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal message: %w", err)
	}

	if err := s.redisClient.LPush(ctx, "ticket_queue", string(msgJSON)).Err(); err != nil {
		return nil, fmt.Errorf("failed to push to queue: %w", err)
	}

	log.Printf("🎫 Booking queued: Order #%d, Event #%d, Seat %s", order.ID, req.EventID, req.SeatCode)

	return &models.BookingResponse{
		OrderID: order.ID,
		Message: "Đơn hàng đang được xử lý",
	}, nil
}

// GetOrderStatus returns the current status of an order
func (s *BookingService) GetOrderStatus(ctx context.Context, orderID int) (*models.Order, error) {
	return s.orderRepo.FindByID(ctx, orderID)
}

// GetUserOrders returns all orders for a user
func (s *BookingService) GetUserOrders(ctx context.Context, userID int) ([]models.Order, error) {
	return s.orderRepo.FindByUserID(ctx, userID)
}

// GetEvents returns all events
func (s *BookingService) GetEvents(ctx context.Context) ([]models.Event, error) {
	return s.eventRepo.FindAll(ctx)
}

// GetEvent returns a single event by ID
func (s *BookingService) GetEvent(ctx context.Context, id int) (*models.Event, error) {
	return s.eventRepo.FindByID(ctx, id)
}

// GetTicketsByEvent returns all tickets for an event
func (s *BookingService) GetTicketsByEvent(ctx context.Context, eventID int) ([]models.Ticket, error) {
	return s.ticketRepo.FindByEventID(ctx, eventID)
}

// GetAvailableCount returns the current available tickets count from Redis
func (s *BookingService) GetAvailableCount(ctx context.Context, eventID int) (int64, error) {
	key := fmt.Sprintf("event:%d:tickets", eventID)
	return s.redisClient.Get(ctx, key).Int64()
}
