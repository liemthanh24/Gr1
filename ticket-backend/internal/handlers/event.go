package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"ticket-backend/internal/models"
	"ticket-backend/internal/services"
)

type EventHandler struct {
	bookingService *services.BookingService
}

func NewEventHandler(bookingService *services.BookingService) *EventHandler {
	return &EventHandler{bookingService: bookingService}
}

// AdminListEvents godoc
// GET /api/v1/admin/events
func (h *EventHandler) AdminListEvents(c *fiber.Ctx) error {
	events, err := h.bookingService.GetEvents(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch events",
		})
	}

	for i := range events {
		count, err := h.bookingService.GetAvailableCount(c.Context(), events[i].ID)
		if err == nil {
			events[i].AvailableTickets = int(count)
		}
	}

	return c.JSON(fiber.Map{"events": events})
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

// CreateEvent godoc
func (h *EventHandler) CreateEvent(c *fiber.Ctx) error {
	var req models.Event
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	if req.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Event name is required"})
	}
	if req.TotalTickets <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Total tickets must be positive"})
	}
	if req.Price < 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Price cannot be negative"})
	}

	event, err := h.bookingService.CreateEvent(c.Context(), req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create event"})
	}
	return c.Status(fiber.StatusCreated).JSON(event)
}

// UpdateEvent godoc
func (h *EventHandler) UpdateEvent(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid event ID"})
	}
	var req models.Event
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	if req.Price < 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Price cannot be negative"})
	}

	event, err := h.bookingService.UpdateEvent(c.Context(), id, req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update event"})
	}
	return c.JSON(event)
}

// DeleteEvent godoc
func (h *EventHandler) DeleteEvent(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))
	if err := h.bookingService.DeleteEvent(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete event"})
	}
	return c.JSON(fiber.Map{"message": "Event deleted successfully"})
}
