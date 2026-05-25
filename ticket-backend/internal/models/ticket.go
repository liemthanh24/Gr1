package models

type Ticket struct {
	ID       int    `json:"id"`
	EventID  int    `json:"event_id"`
	SeatCode string `json:"seat_code"`
	IsLocked bool   `json:"is_locked"`
}
