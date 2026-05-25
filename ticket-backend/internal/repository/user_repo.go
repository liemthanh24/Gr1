package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"ticket-backend/internal/models"
)

type UserRepository struct {
	pool *pgxpool.Pool
}

func NewUserRepository(pool *pgxpool.Pool) *UserRepository {
	return &UserRepository{pool: pool}
}

func (r *UserRepository) Create(ctx context.Context, email, passwordHash string) (*models.User, error) {
	var user models.User
	err := r.pool.QueryRow(ctx,
		"INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at",
		email, passwordHash,
	).Scan(&user.ID, &user.Email, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	err := r.pool.QueryRow(ctx,
		"SELECT id, email, password_hash, created_at FROM users WHERE email = $1",
		email,
	).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}
