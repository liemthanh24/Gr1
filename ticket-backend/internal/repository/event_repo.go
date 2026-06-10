package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"ticket-backend/internal/models"
)

type EventRepository struct {
	pool *pgxpool.Pool
}

func NewEventRepository(pool *pgxpool.Pool) *EventRepository {
	return &EventRepository{pool: pool}
}

func (r *EventRepository) FindAll(ctx context.Context) ([]models.Event, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, name, COALESCE(description,''), COALESCE(venue,''), COALESCE(image_url,''),
		 total_tickets, available_tickets, price, event_date, created_at
		 FROM events ORDER BY event_date ASC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []models.Event
	for rows.Next() {
		var e models.Event
		if err := rows.Scan(&e.ID, &e.Name, &e.Description, &e.Venue, &e.ImageURL,
			&e.TotalTickets, &e.AvailableTickets, &e.Price, &e.EventDate, &e.CreatedAt); err != nil {
			return nil, err
		}
		events = append(events, e)
	}
	return events, nil
}

func (r *EventRepository) FindByID(ctx context.Context, id int) (*models.Event, error) {
	var e models.Event
	err := r.pool.QueryRow(ctx,
		`SELECT id, name, COALESCE(description,''), COALESCE(venue,''), COALESCE(image_url,''),
		 total_tickets, available_tickets, price, event_date, created_at
		 FROM events WHERE id = $1`,
		id,
	).Scan(&e.ID, &e.Name, &e.Description, &e.Venue, &e.ImageURL,
		&e.TotalTickets, &e.AvailableTickets, &e.Price, &e.EventDate, &e.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *EventRepository) Create(ctx context.Context, e models.Event) (*models.Event, error) {
	err := r.pool.QueryRow(ctx,
		`INSERT INTO events (name, description, venue, image_url, total_tickets, available_tickets, price, event_date)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, created_at`,
		e.Name, e.Description, e.Venue, e.ImageURL, e.TotalTickets, e.AvailableTickets, e.Price, e.EventDate,
	).Scan(&e.ID, &e.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *EventRepository) Update(ctx context.Context, id int, e models.Event) (*models.Event, error) {
	err := r.pool.QueryRow(ctx,
		`UPDATE events SET name=$1, description=$2, venue=$3, image_url=$4, total_tickets=$5, available_tickets=$6, price=$7, event_date=$8
		 WHERE id = $9 RETURNING id, created_at`,
		e.Name, e.Description, e.Venue, e.ImageURL, e.TotalTickets, e.AvailableTickets, e.Price, e.EventDate, id,
	).Scan(&e.ID, &e.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *EventRepository) CountAll(ctx context.Context) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM events").Scan(&count)
	return count, err
}

func (r *EventRepository) Delete(ctx context.Context, id int) error {
	_, err := r.pool.Exec(ctx, "DELETE FROM events WHERE id = $1", id)
	return err
}
