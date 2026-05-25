package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"ticket-backend/pkg/utils"
)

func AuthRequired(jwtSecret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Get Authorization header
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Missing authorization header",
			})
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid authorization format",
			})
		}

		// Parse and validate token
		claims, err := utils.ParseToken(parts[1], jwtSecret)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid or expired token",
			})
		}

		// Store user info in context
		c.Locals("user_id", claims.UserID)
		c.Locals("email", claims.Email)

		return c.Next()
	}
}
