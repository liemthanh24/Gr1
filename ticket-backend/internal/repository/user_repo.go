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

func (r *UserRepository) Create(ctx context.Context, email, passwordHash, name string) (*models.User, error) {
	var user models.User
	err := r.pool.QueryRow(ctx,
		"INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, 'user') RETURNING id, name, email, role, phone, cccd, dob, address, created_at",
		email, passwordHash, name,
	).Scan(&user.ID, &user.Name, &user.Email, &user.Role, &user.Phone, &user.CCCD, &user.DOB, &user.Address, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	err := r.pool.QueryRow(ctx,
		"SELECT id, name, email, password_hash, role, COALESCE(phone, ''), COALESCE(cccd, ''), CAST(COALESCE(dob, '1900-01-01') AS TEXT), COALESCE(address, ''), created_at FROM users WHERE email = $1",
		email,
	).Scan(&user.ID, &user.Name, &user.Email, &user.PasswordHash, &user.Role, &user.Phone, &user.CCCD, &user.DOB, &user.Address, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindById(ctx context.Context, id int) (*models.User, error) {
	var user models.User
	err := r.pool.QueryRow(ctx,
		"SELECT id, name, email, role, COALESCE(phone, ''), COALESCE(cccd, ''), CAST(COALESCE(dob, '1900-01-01') AS TEXT), COALESCE(address, ''), created_at FROM users WHERE id = $1",
		id,
	).Scan(&user.ID, &user.Name, &user.Email, &user.Role, &user.Phone, &user.CCCD, &user.DOB, &user.Address, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) UpdateProfile(ctx context.Context, id int, req models.UpdateProfileRequest) (*models.User, error) {
	var user models.User
	// Ensure empty strings are handled, optionally convert dob empty string to NULL or a default date
	dobVal := req.DOB
	if dobVal == "" {
		dobVal = "1900-01-01"
	}
	err := r.pool.QueryRow(ctx,
		"UPDATE users SET name = $1, phone = $2, cccd = $3, dob = $4, address = $5 WHERE id = $6 RETURNING id, name, email, role, COALESCE(phone, ''), COALESCE(cccd, ''), CAST(COALESCE(dob, '1900-01-01') AS TEXT), COALESCE(address, ''), created_at",
		req.Name, req.Phone, req.CCCD, dobVal, req.Address, id,
	).Scan(&user.ID, &user.Name, &user.Email, &user.Role, &user.Phone, &user.CCCD, &user.DOB, &user.Address, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) UpdatePassword(ctx context.Context, id int, passwordHash string) error {
	_, err := r.pool.Exec(ctx, "UPDATE users SET password_hash = $1 WHERE id = $2", passwordHash, id)
	return err
}

func (r *UserRepository) UpdateRole(ctx context.Context, id int, role string) (*models.User, error) {
	var user models.User
	err := r.pool.QueryRow(ctx,
		"UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role, COALESCE(phone, ''), COALESCE(cccd, ''), CAST(COALESCE(dob, '1900-01-01') AS TEXT), COALESCE(address, ''), created_at",
		role, id,
	).Scan(&user.ID, &user.Name, &user.Email, &user.Role, &user.Phone, &user.CCCD, &user.DOB, &user.Address, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}
