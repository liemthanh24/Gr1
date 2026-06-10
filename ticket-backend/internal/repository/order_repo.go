package repository

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"ticket-backend/internal/models"
)

type OrderRepository struct {
	pool *pgxpool.Pool
}

func NewOrderRepository(pool *pgxpool.Pool) *OrderRepository {
	return &OrderRepository{pool: pool}
}

func (r *OrderRepository) CreatePending(ctx context.Context, userID, eventID int, seatCode string) (*models.Order, error) {
	var order models.Order
	err := r.pool.QueryRow(ctx,
		`INSERT INTO orders (user_id, event_id, seat_code, status) 
		 VALUES ($1, $2, $3, 'pending') 
		 RETURNING id, user_id, event_id, seat_code, status, created_at`,
		userID, eventID, seatCode,
	).Scan(&order.ID, &order.UserID, &order.EventID, &order.SeatCode, &order.Status, &order.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &order, nil
}

func (r *OrderRepository) UpdateStatus(ctx context.Context, orderID int, status string, ticketID *int) error {
	if ticketID != nil {
		_, err := r.pool.Exec(ctx,
			"UPDATE orders SET status = $1::order_status, ticket_id = $2 WHERE id = $3",
			status, *ticketID, orderID,
		)
		return err
	}
	_, err := r.pool.Exec(ctx,
		"UPDATE orders SET status = $1::order_status WHERE id = $2",
		status, orderID,
	)
	return err
}

func (r *OrderRepository) FindByID(ctx context.Context, id int) (*models.Order, error) {
	var order models.Order
	var ticketID *int
	err := r.pool.QueryRow(ctx,
		`SELECT o.id, o.user_id, o.event_id, o.ticket_id, o.seat_code, o.status, o.created_at, 
		 COALESCE(e.name, '') as event_name
		 FROM orders o LEFT JOIN events e ON o.event_id = e.id 
		 WHERE o.id = $1`,
		id,
	).Scan(&order.ID, &order.UserID, &order.EventID, &ticketID, &order.SeatCode, &order.Status, &order.CreatedAt, &order.EventName)
	if err != nil {
		return nil, err
	}
	order.TicketID = ticketID
	return &order, nil
}

func (r *OrderRepository) FindByUserID(ctx context.Context, userID int) ([]models.Order, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT o.id, o.user_id, o.event_id, o.ticket_id, o.seat_code, o.status, o.created_at,
		 COALESCE(e.name, '') as event_name
		 FROM orders o LEFT JOIN events e ON o.event_id = e.id
		 WHERE o.user_id = $1 ORDER BY o.created_at DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []models.Order
	for rows.Next() {
		var o models.Order
		var ticketID *int
		if err := rows.Scan(&o.ID, &o.UserID, &o.EventID, &ticketID, &o.SeatCode, &o.Status, &o.CreatedAt, &o.EventName); err != nil {
			return nil, err
		}
		o.TicketID = ticketID
		orders = append(orders, o)
	}
	return orders, nil
}

func (r *OrderRepository) FindAll(ctx context.Context) ([]models.Order, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT o.id, o.user_id, o.event_id, o.ticket_id, o.seat_code, o.status, o.created_at,
		 COALESCE(e.name, '') as event_name
		 FROM orders o LEFT JOIN events e ON o.event_id = e.id
		 ORDER BY o.created_at DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []models.Order
	for rows.Next() {
		var o models.Order
		var ticketID *int
		if err := rows.Scan(&o.ID, &o.UserID, &o.EventID, &ticketID, &o.SeatCode, &o.Status, &o.CreatedAt, &o.EventName); err != nil {
			return nil, err
		}
		o.TicketID = ticketID
		orders = append(orders, o)
	}
	return orders, nil
}

func (r *OrderRepository) CountAll(ctx context.Context) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM orders").Scan(&count)
	return count, err
}

func (r *OrderRepository) CountByStatus(ctx context.Context) (map[string]int, error) {
	rows, err := r.pool.Query(ctx, "SELECT status::text, COUNT(*) FROM orders GROUP BY status")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[string]int)
	for rows.Next() {
		var status string
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			return nil, err
		}
		result[status] = count
	}
	return result, nil
}

func (r *OrderRepository) SumConfirmedRevenue(ctx context.Context) (float64, error) {
	var total float64
	err := r.pool.QueryRow(ctx,
		`SELECT COALESCE(SUM(e.price), 0) FROM orders o
		 JOIN events e ON o.event_id = e.id
		 WHERE o.status = 'confirmed'`,
	).Scan(&total)
	return total, err
}

// NullifyEventTicketIDs sets ticket_id = NULL for all orders tied to an event
func (r *OrderRepository) NullifyEventTicketIDs(ctx context.Context, eventID int) error {
	_, err := r.pool.Exec(ctx,
		"UPDATE orders SET ticket_id = NULL WHERE event_id = $1 AND ticket_id IS NOT NULL",
		eventID,
	)
	return err
}

// Pool returns the underlying pool for transaction use
func (r *OrderRepository) Pool() *pgxpool.Pool {
	return r.pool
}

// BeginTx starts a new database transaction
func (r *OrderRepository) BeginTx(ctx context.Context) (pgx.Tx, error) {
	return r.pool.Begin(ctx)
}
