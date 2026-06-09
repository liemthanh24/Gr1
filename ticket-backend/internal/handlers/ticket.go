package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"ticket-backend/internal/models"
	"ticket-backend/internal/services"
)

type TicketHandler struct {
	bookingService *services.BookingService
}

func NewTicketHandler(bookingService *services.BookingService) *TicketHandler {
	return &TicketHandler{bookingService: bookingService}
}

func (h *TicketHandler) BookTicket(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int)

	var req models.BookingRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if req.EventID == 0 || len(req.SeatCodes) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "event_id and seat_codes are required",
		})
	}

	resp, err := h.bookingService.BookTicket(c.Context(), userID, req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusAccepted).JSON(resp)
}

// GetOrderStatus godoc
// GET /api/v1/orders/:id/status
func (h *TicketHandler) GetOrderStatus(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int)

	orderID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid order ID",
		})
	}

	order, err := h.bookingService.GetOrderStatus(c.Context(), orderID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Order not found",
		})
	}

	// Verify order belongs to user
	if order.UserID != userID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	return c.JSON(fiber.Map{"order": order})
}

// GetUserOrders godoc
// GET /api/v1/orders
func (h *TicketHandler) GetUserOrders(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int)

	orders, err := h.bookingService.GetUserOrders(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch orders",
		})
	}

	if orders == nil {
		orders = []models.Order{}
	}

	return c.JSON(fiber.Map{"orders": orders})
}
