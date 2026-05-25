package models

import "time"

type Order struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	EventID   int       `json:"event_id"`
	TicketID  *int      `json:"ticket_id,omitempty"`
	SeatCode  string    `json:"seat_code"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	// Joined fields for display
	EventName string `json:"event_name,omitempty"`
}

type BookingRequest struct {
	EventID  int    `json:"event_id" validate:"required"`
	SeatCode string `json:"seat_code" validate:"required"`
}

type BookingResponse struct {
	OrderID int    `json:"order_id"`
	Message string `json:"message"`
}

type BookingMessage struct {
	OrderID  int    `json:"order_id"`
	UserID   int    `json:"user_id"`
	EventID  int    `json:"event_id"`
	SeatCode string `json:"seat_code"`
}
