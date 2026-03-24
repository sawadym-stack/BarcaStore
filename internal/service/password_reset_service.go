package service

import (
	"errors"
	"fmt"
	"math/rand"
	"time"

	"github.com/sawadym-stack/barca-store-clean/internal/domain/entities"
	"github.com/sawadym-stack/barca-store-clean/internal/domain/ports"
)

type PasswordResetService struct {
	repo          ports.PasswordResetRepository
	emailProvider ports.EmailProvider
	expiryMin     int
}

func NewPasswordResetService(repo ports.PasswordResetRepository, emailProvider ports.EmailProvider, expiryMin int) *PasswordResetService {
	return &PasswordResetService{
		repo:          repo,
		emailProvider: emailProvider,
		expiryMin:     expiryMin,
	}
}

func (s *PasswordResetService) GenerateAndSendCode(userID int64, email string) (string, error) {
	// Generate 6-digit numeric code
	code := fmt.Sprintf("%06d", rand.Intn(1000000))

	reset := &entities.PasswordReset{
		UserID:    userID,
		Token:     code,
		ExpiresAt: time.Now().Add(time.Duration(s.expiryMin) * time.Minute),
		IsUsed:    false,
	}

	if err := s.repo.Create(reset); err != nil {
		return "", err
	}

	// Send via email provider
	if err := s.emailProvider.SendPasswordReset(email, code); err != nil {
		fmt.Printf("❌ Failed to send reset code to %s: %v\n", email, err)
		return "", err
	}

	fmt.Printf("📧 Password reset code for %s sent successfully\n", email)

	return code, nil
}

func (s *PasswordResetService) VerifyCode(email, code string) (*entities.PasswordReset, error) {
	reset, err := s.repo.FindByToken(code)
	if err != nil {
		return nil, err
	}

	if reset == nil {
		return nil, errors.New("invalid or expired password reset token")
	}

	return reset, nil
}

func (s *PasswordResetService) MarkAsUsed(id int64) error {
	return s.repo.MarkAsUsed(id)
}
