package models

import "time"

type Event struct {
	ID               int       `json:"id"`
	Name             string    `json:"name"`
	Description      string    `json:"description"`
	Venue            string    `json:"venue"`
	ImageURL         string    `json:"image_url"`
	TotalTickets     int       `json:"total_tickets"`
	AvailableTickets int       `json:"available_tickets"`
	Price            float64   `json:"price"`
	EventDate        time.Time `json:"event_date"`
	CreatedAt        time.Time `json:"created_at"`
}
