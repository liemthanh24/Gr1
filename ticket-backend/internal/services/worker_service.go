package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
	"ticket-backend/internal/models"
	"ticket-backend/internal/repository"
)

type WorkerService struct {
	orderRepo   *repository.OrderRepository
	ticketRepo  *repository.TicketRepository
	redisClient *redis.Client
}

func NewWorkerService(
	orderRepo *repository.OrderRepository,
	ticketRepo *repository.TicketRepository,
	redisClient *redis.Client,
) *WorkerService {
	return &WorkerService{
		orderRepo:   orderRepo,
		ticketRepo:  ticketRepo,
		redisClient: redisClient,
	}
}

// Run starts the worker loop, processing messages from the ticket_queue
func (w *WorkerService) Run(ctx context.Context) {
	log.Println("🔄 Worker started, waiting for messages...")

	for {
		select {
		case <-ctx.Done():
			log.Println("⏹ Worker shutting down...")
			return
		default:
			w.processNext(ctx)
		}
	}
}

func (w *WorkerService) processNext(ctx context.Context) {
	// BRPOP with 5 second timeout to allow graceful shutdown checks
	result, err := w.redisClient.BRPop(ctx, 5*time.Second, "ticket_queue").Result()
	if err != nil {
		if err == redis.Nil {
			return // timeout, no message
		}
		log.Printf("❌ Redis BRPOP error: %v", err)
		return
	}

	// result[0] is the key name, result[1] is the message
	var msg models.BookingMessage
	if err := json.Unmarshal([]byte(result[1]), &msg); err != nil {
		log.Printf("❌ Failed to unmarshal message: %v", err)
		return
	}

	log.Printf("📨 Processing: Order #%d, Event #%d, Seat %s", msg.OrderID, msg.EventID, msg.SeatCode)

	if err := w.processBooking(ctx, msg); err != nil {
		log.Printf("❌ Failed to process order #%d: %v", msg.OrderID, err)
		// Mark order as cancelled
		w.orderRepo.UpdateStatus(ctx, msg.OrderID, "cancelled", nil)
		// Return ticket to Redis inventory
		key := fmt.Sprintf("event:%d:tickets", msg.EventID)
		w.redisClient.Incr(ctx, key)
	}
}

func (w *WorkerService) processBooking(ctx context.Context, msg models.BookingMessage) error {
	// Begin transaction
	tx, err := w.orderRepo.BeginTx(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// Find the ticket by event_id and seat_code
	var ticketID int
	var isLocked bool
	err = tx.QueryRow(ctx,
		"SELECT id, is_locked FROM tickets WHERE event_id = $1 AND seat_code = $2 FOR UPDATE",
		msg.EventID, msg.SeatCode,
	).Scan(&ticketID, &isLocked)
	if err != nil {
		return fmt.Errorf("ticket not found: %w", err)
	}

	// Check if ticket is already locked
	if isLocked {
		return fmt.Errorf("seat %s already booked", msg.SeatCode)
	}

	// Lock the ticket
	_, err = tx.Exec(ctx,
		"UPDATE tickets SET is_locked = TRUE WHERE id = $1",
		ticketID,
	)
	if err != nil {
		return fmt.Errorf("failed to lock ticket: %w", err)
	}

	// Update order with ticket_id and confirmed status
	_, err = tx.Exec(ctx,
		"UPDATE orders SET status = 'confirmed'::order_status, ticket_id = $1 WHERE id = $2",
		ticketID, msg.OrderID,
	)
	if err != nil {
		return fmt.Errorf("failed to update order: %w", err)
	}

	// Update available_tickets count in events table
	_, err = tx.Exec(ctx,
		"UPDATE events SET available_tickets = available_tickets - 1 WHERE id = $1 AND available_tickets > 0",
		msg.EventID,
	)
	if err != nil {
		return fmt.Errorf("failed to update event inventory: %w", err)
	}

	// Commit transaction
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit: %w", err)
	}

	log.Printf("✅ Order #%d confirmed! Seat %s locked for Event #%d", msg.OrderID, msg.SeatCode, msg.EventID)
	return nil
}
