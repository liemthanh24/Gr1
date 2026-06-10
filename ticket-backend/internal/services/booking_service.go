package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math"

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

func (s *BookingService) BookTicket(ctx context.Context, userID int, req models.BookingRequest) (*models.BookingResponse, error) {
	key := fmt.Sprintf("event:%d:tickets", req.EventID)
	seatCodes := req.SeatCodes

	// Phase 1: Atomic DECR for all seats
	for _, seatCode := range seatCodes {
		remaining, err := s.redisClient.Decr(ctx, key).Result()
		if err != nil {
			s.rollbackRedis(ctx, key, len(seatCodes))
			return nil, fmt.Errorf("redis error on seat %s: %w", seatCode, err)
		}
		if remaining < 0 {
			s.redisClient.Incr(ctx, key) // rollback this seat
			s.rollbackRedis(ctx, key, len(seatCodes))
			return nil, fmt.Errorf("Hết vé! Ghế %s không còn trống.", seatCode)
		}
	}

	// Phase 2: Create orders and push to queue
	var orderIDs []int
	for _, seatCode := range seatCodes {
		order, err := s.orderRepo.CreatePending(ctx, userID, req.EventID, seatCode)
		if err != nil {
			s.rollbackRedis(ctx, key, len(seatCodes))
			s.rollbackOrders(ctx, orderIDs)
			return nil, fmt.Errorf("failed to create order for seat %s: %w", seatCode, err)
		}

		msg := models.BookingMessage{
			OrderID:  order.ID,
			UserID:   userID,
			EventID:  req.EventID,
			SeatCode: seatCode,
		}
		msgJSON, _ := json.Marshal(msg)
		if err := s.redisClient.LPush(ctx, "ticket_queue", string(msgJSON)).Err(); err != nil {
			s.rollbackRedis(ctx, key, len(seatCodes))
			s.rollbackOrders(ctx, orderIDs)
			return nil, fmt.Errorf("failed to push to queue for seat %s: %w", seatCode, err)
		}

		orderIDs = append(orderIDs, order.ID)
		log.Printf("🎫 Booking queued: Order #%d, Event #%d, Seat %s", order.ID, req.EventID, seatCode)
	}

	return &models.BookingResponse{
		OrderIDs: orderIDs,
		Message:  fmt.Sprintf("%d vé đang được xử lý", len(seatCodes)),
	}, nil
}

func (s *BookingService) rollbackRedis(ctx context.Context, key string, n int) {
	for i := 0; i < n; i++ {
		s.redisClient.Incr(ctx, key)
	}
}

func (s *BookingService) rollbackOrders(ctx context.Context, orderIDs []int) {
	for _, id := range orderIDs {
		_ = s.orderRepo.UpdateStatus(ctx, id, "cancelled", nil)
	}
}

// GetOrderStatus returns the current status of an order
func (s *BookingService) GetOrderStatus(ctx context.Context, orderID int) (*models.Order, error) {
	return s.orderRepo.FindByID(ctx, orderID)
}

// GetUserOrders returns all orders for a user
func (s *BookingService) GetUserOrders(ctx context.Context, userID int) ([]models.Order, error) {
	return s.orderRepo.FindByUserID(ctx, userID)
}

// GetTotalEvents returns the total number of events
func (s *BookingService) GetTotalEvents(ctx context.Context) (int, error) {
	return s.eventRepo.CountAll(ctx)
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

// CreateEvent creates a new event and auto-generates seat tickets
func (s *BookingService) CreateEvent(ctx context.Context, e models.Event) (*models.Event, error) {
	event, err := s.eventRepo.Create(ctx, e)
	if err != nil {
		return nil, err
	}

	seatCodes := generateSeatCodes(event.TotalTickets)
	if err := s.ticketRepo.BulkCreate(ctx, event.ID, seatCodes); err != nil {
		return nil, fmt.Errorf("failed to generate seats: %w", err)
	}

	// Load into Redis
	key := fmt.Sprintf("event:%d:tickets", event.ID)
	s.redisClient.Set(ctx, key, event.AvailableTickets, 0)

	return event, nil
}

// UpdateEvent updates an event
func (s *BookingService) UpdateEvent(ctx context.Context, id int, e models.Event) (*models.Event, error) {
	return s.eventRepo.Update(ctx, id, e)
}

// DeleteEvent deletes an event with cascade-safe order handling
func (s *BookingService) DeleteEvent(ctx context.Context, id int) error {
	// Nullify ticket_id on orders referencing this event's tickets
	if err := s.orderRepo.NullifyEventTicketIDs(ctx, id); err != nil {
		return fmt.Errorf("failed to nullify order tickets: %w", err)
	}
	return s.eventRepo.Delete(ctx, id)
}

// generateSeatCodes creates seat codes like A1, A2, ... with 10 seats per row
func generateSeatCodes(total int) []string {
	seatsPerRow := 10
	codes := make([]string, total)
	for i := 0; i < total; i++ {
		row := rune('A' + i/seatsPerRow)
		seat := i%seatsPerRow + 1
		codes[i] = fmt.Sprintf("%c%d", row, int(math.Min(float64(seat), float64(seatsPerRow))))
	}
	return codes
}
