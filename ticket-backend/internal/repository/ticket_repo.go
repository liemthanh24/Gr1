package repository

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"ticket-backend/internal/models"
)

type TicketRepository struct {
	pool *pgxpool.Pool
}

func NewTicketRepository(pool *pgxpool.Pool) *TicketRepository {
	return &TicketRepository{pool: pool}
}

func (r *TicketRepository) FindByEventID(ctx context.Context, eventID int) ([]models.Ticket, error) {
	rows, err := r.pool.Query(ctx,
		"SELECT id, event_id, seat_code, is_locked FROM tickets WHERE event_id = $1 ORDER BY seat_code",
		eventID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tickets []models.Ticket
	for rows.Next() {
		var t models.Ticket
		if err := rows.Scan(&t.ID, &t.EventID, &t.SeatCode, &t.IsLocked); err != nil {
			return nil, err
		}
		tickets = append(tickets, t)
	}
	return tickets, nil
}

func (r *TicketRepository) FindByEventAndSeat(ctx context.Context, eventID int, seatCode string) (*models.Ticket, error) {
	var t models.Ticket
	err := r.pool.QueryRow(ctx,
		"SELECT id, event_id, seat_code, is_locked FROM tickets WHERE event_id = $1 AND seat_code = $2",
		eventID, seatCode,
	).Scan(&t.ID, &t.EventID, &t.SeatCode, &t.IsLocked)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *TicketRepository) BulkCreate(ctx context.Context, eventID int, seatCodes []string) error {
	batch := &pgx.Batch{}
	for _, seatCode := range seatCodes {
		batch.Queue("INSERT INTO tickets (event_id, seat_code) VALUES ($1, $2)", eventID, seatCode)
	}
	br := r.pool.SendBatch(ctx, batch)
	defer br.Close()
	for range seatCodes {
		if _, err := br.Exec(); err != nil {
			return err
		}
	}
	return nil
}

func (r *TicketRepository) LockTicket(ctx context.Context, ticketID int) error {
	_, err := r.pool.Exec(ctx,
		"UPDATE tickets SET is_locked = TRUE WHERE id = $1",
		ticketID,
	)
	return err
}
