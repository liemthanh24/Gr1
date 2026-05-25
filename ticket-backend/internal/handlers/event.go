package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"ticket-backend/internal/services"
)

type EventHandler struct {
	bookingService *services.BookingService
}

func NewEventHandler(bookingService *services.BookingService) *EventHandler {
	return &EventHandler{bookingService: bookingService}
}

// ListEvents godoc
// GET /api/v1/events
func (h *EventHandler) ListEvents(c *fiber.Ctx) error {
	events, err := h.bookingService.GetEvents(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch events",
		})
	}

	// Enrich with real-time available count from Redis
	for i := range events {
		count, err := h.bookingService.GetAvailableCount(c.Context(), events[i].ID)
		if err == nil {
			events[i].AvailableTickets = int(count)
		}
	}

	return c.JSON(fiber.Map{"events": events})
}

// GetEvent godoc
// GET /api/v1/events/:id
func (h *EventHandler) GetEvent(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid event ID",
		})
	}

	event, err := h.bookingService.GetEvent(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Event not found",
		})
	}

	// Real-time count from Redis
	count, err := h.bookingService.GetAvailableCount(c.Context(), event.ID)
	if err == nil {
		event.AvailableTickets = int(count)
	}

	// Get ticket map (seats)
	tickets, err := h.bookingService.GetTicketsByEvent(c.Context(), id)
	if err != nil {
		tickets = nil
	}

	return c.JSON(fiber.Map{
		"event":   event,
		"tickets": tickets,
	})
}
