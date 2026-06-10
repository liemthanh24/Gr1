package services

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"

	"ticket-backend/internal/models"
	"ticket-backend/internal/repository"
	"ticket-backend/pkg/utils"
)

type AuthService struct {
	userRepo  *repository.UserRepository
	redis     *redis.Client
	jwtSecret string
}

func NewAuthService(userRepo *repository.UserRepository, redis *redis.Client, jwtSecret string) *AuthService {
	return &AuthService{userRepo: userRepo, redis: redis, jwtSecret: jwtSecret}
}

func (s *AuthService) Register(ctx context.Context, req models.RegisterRequest) (*models.AuthResponse, error) {
	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}

	user, err := s.userRepo.Create(ctx, req.Email, hash, req.Name)
	if err != nil {
		return nil, fmt.Errorf("registration failed: %w", err)
	}

	token, err := utils.GenerateToken(user.ID, user.Email, user.Role, s.jwtSecret)
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	return &models.AuthResponse{
		Token: token,
		User:  *user,
	}, nil
}

func (s *AuthService) Login(ctx context.Context, req models.LoginRequest) (*models.AuthResponse, error) {
	user, err := s.userRepo.FindByEmail(ctx, req.Email)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	if !utils.CheckPassword(req.Password, user.PasswordHash) {
		return nil, errors.New("invalid email or password")
	}

	token, err := utils.GenerateToken(user.ID, user.Email, user.Role, s.jwtSecret)
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	return &models.AuthResponse{
		Token: token,
		User:  *user,
	}, nil
}

func (s *AuthService) UpdateProfile(ctx context.Context, id int, req models.UpdateProfileRequest) (*models.User, error) {
	return s.userRepo.UpdateProfile(ctx, id, req)
}

func (s *AuthService) GetProfile(ctx context.Context, id int) (*models.User, error) {
	return s.userRepo.FindById(ctx, id)
}

func (s *AuthService) GenerateResetToken(ctx context.Context, email string) (string, error) {
	user, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		return "", errors.New("email not found")
	}

	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return "", errors.New("failed to generate token")
	}
	token := hex.EncodeToString(tokenBytes)

	key := fmt.Sprintf("reset_token:%s", token)
	if err := s.redis.Set(ctx, key, user.ID, 15*time.Minute).Err(); err != nil {
		return "", errors.New("failed to store token")
	}

	return token, nil
}

func (s *AuthService) ResetPassword(ctx context.Context, token, newPassword string) error {
	key := fmt.Sprintf("reset_token:%s", token)
	userID, err := s.redis.Get(ctx, key).Int()
	if err != nil {
		return errors.New("invalid or expired reset token")
	}

	s.redis.Del(ctx, key)

	hash, err := utils.HashPassword(newPassword)
	if err != nil {
		return errors.New("failed to hash password")
	}

	return s.userRepo.UpdatePassword(ctx, userID, hash)
}
