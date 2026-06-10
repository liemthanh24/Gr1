package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"ticket-backend/internal/models"
	"ticket-backend/internal/repository"
	"ticket-backend/internal/services"
)

type AdminHandler struct {
	bookingService *services.BookingService
	userRepo       *repository.UserRepository
	orderRepo      *repository.OrderRepository
}

func NewAdminHandler(bookingService *services.BookingService, userRepo *repository.UserRepository, orderRepo *repository.OrderRepository) *AdminHandler {
	return &AdminHandler{bookingService: bookingService, userRepo: userRepo, orderRepo: orderRepo}
}

func (h *AdminHandler) GetStats(c *fiber.Ctx) error {
	totalEvents, err := h.bookingService.GetTotalEvents(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get events count"})
	}

	totalOrders, err := h.orderRepo.CountAll(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get orders count"})
	}

	totalUsers, err := h.userRepo.CountAll(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get users count"})
	}

	totalRevenue, err := h.orderRepo.SumConfirmedRevenue(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get revenue"})
	}

	ordersByStatus, err := h.orderRepo.CountByStatus(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get orders by status"})
	}

	stats := models.AdminStats{
		TotalEvents:    totalEvents,
		TotalOrders:    totalOrders,
		TotalUsers:     totalUsers,
		TotalRevenue:   totalRevenue,
		OrdersByStatus: ordersByStatus,
	}

	return c.JSON(stats)
}

func (h *AdminHandler) ListAllOrders(c *fiber.Ctx) error {
	orders, err := h.orderRepo.FindAll(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch orders"})
	}
	if orders == nil {
		orders = []models.Order{}
	}
	return c.JSON(fiber.Map{"orders": orders})
}

func (h *AdminHandler) ListAllUsers(c *fiber.Ctx) error {
	users, err := h.userRepo.FindAll(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch users"})
	}
	if users == nil {
		users = []models.User{}
	}
	return c.JSON(fiber.Map{"users": users})
}

func (h *AdminHandler) UpdateUserRole(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	var req struct {
		Role string `json:"role"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}
	if req.Role != "admin" && req.Role != "user" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Role must be 'admin' or 'user'"})
	}

	callerID := c.Locals("user_id").(int)
	if callerID == id && req.Role != "admin" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot demote yourself"})
	}

	user, err := h.userRepo.UpdateRole(c.Context(), id, req.Role)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update role"})
	}

	return c.JSON(user)
}
