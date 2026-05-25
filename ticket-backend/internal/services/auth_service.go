package services

import (
	"context"
	"errors"

	"ticket-backend/internal/models"
	"ticket-backend/internal/repository"
	"ticket-backend/pkg/utils"
)

type AuthService struct {
	userRepo  *repository.UserRepository
	jwtSecret string
}

func NewAuthService(userRepo *repository.UserRepository, jwtSecret string) *AuthService {
	return &AuthService{userRepo: userRepo, jwtSecret: jwtSecret}
}

func (s *AuthService) Register(ctx context.Context, req models.RegisterRequest) (*models.AuthResponse, error) {
	// Hash password
	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}

	// Create user
	user, err := s.userRepo.Create(ctx, req.Email, hash)
	if err != nil {
		return nil, errors.New("email already exists")
	}

	// Generate JWT
	token, err := utils.GenerateToken(user.ID, user.Email, s.jwtSecret)
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	return &models.AuthResponse{
		Token: token,
		User:  *user,
	}, nil
}

func (s *AuthService) Login(ctx context.Context, req models.LoginRequest) (*models.AuthResponse, error) {
	// Find user
	user, err := s.userRepo.FindByEmail(ctx, req.Email)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	// Check password
	if !utils.CheckPassword(req.Password, user.PasswordHash) {
		return nil, errors.New("invalid email or password")
	}

	// Generate JWT
	token, err := utils.GenerateToken(user.ID, user.Email, s.jwtSecret)
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	return &models.AuthResponse{
		Token: token,
		User:  *user,
	}, nil
}
