package service

import (
	"fmt"
	"math/rand"
	"time"

	"github.com/sawadym-stack/barca-store-clean/internal/domain/entities"
	"github.com/sawadym-stack/barca-store-clean/internal/domain/ports"
)

type OTPService struct {
	repo          ports.OTPRepository
	emailProvider ports.EmailProvider
	expiryMin     int
}

func NewOTPService(repo ports.OTPRepository, emailProvider ports.EmailProvider, expiryMin int) *OTPService {
	return &OTPService{
		repo:          repo,
		emailProvider: emailProvider,
		expiryMin:     expiryMin,
	}
}

func (s *OTPService) GenerateAndSend(email string) (string, error) {
	// 1. Check if a non-expired, non-used OTP was sent recently (within last 60s)
	// to prevent duplicate sends on rapid clicks or retries.
	existing, _ := s.repo.FindByEmailAndType(email)
	if existing != nil {
		if time.Since(existing.CreatedAt) < 60*time.Second {
			fmt.Printf("⚠️ OTP rate limit hit for %s. Last sent %v ago.\n", email, time.Since(existing.CreatedAt))
			return "", fmt.Errorf("please wait 60 seconds before requesting a new code")
		}
	}

	// Generate 6-digit OTP
	code := fmt.Sprintf("%06d", rand.Intn(1000000))

	otp := &entities.OTP{
		Email:     email,
		Code:      code,
		ExpiresAt: time.Now().Add(time.Duration(s.expiryMin) * time.Minute),
		IsUsed:    false,
	}

	if err := s.repo.Create(otp); err != nil {
		return "", err
	}

	// Send via email provider
	if err := s.emailProvider.SendOTP(email, code); err != nil {
		fmt.Printf("❌ Failed to send OTP to %s: %v\n", email, err)
		// We still return the code/nil if we want the process to continue,
		// but usually we should return error if email fails.
		return "", err
	}

	fmt.Printf("📧 OTP for %s sent successfully\n", email)

	return code, nil
}

func (s *OTPService) VerifyOTP(email, code string) error {
	otp, err := s.repo.FindByEmailAndType(email)
	if err != nil {
		return err
	}

	if otp == nil {
		return fmt.Errorf("invalid or expired OTP")
	}

	if otp.Code != code {
		return fmt.Errorf("incorrect OTP code")
	}

	// Mark as used
	if err := s.repo.MarkAsUsed(otp.ID); err != nil {
		return err
	}

	return nil
}
