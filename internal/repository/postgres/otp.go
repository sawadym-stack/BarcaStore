package postgres

import (
	"time"

	"github.com/sawadym-stack/barca-store-clean/internal/domain/entities"
	"gorm.io/gorm"
)

type OTPRepository struct {
	db *gorm.DB
}

func NewOTPRepo(db *gorm.DB) *OTPRepository {
	return &OTPRepository{db: db}
}

func (r *OTPRepository) Create(otp *entities.OTP) error {
	// Delete any existing OTP for this email to avoid unique constraint violation
	r.db.Where("email = ?", otp.Email).Delete(&entities.OTP{})
	return r.db.Create(otp).Error
}

func (r *OTPRepository) FindByEmailAndType(email string) (*entities.OTP, error) {
	var otp entities.OTP
	if err := r.db.Where("email = ? AND is_used = false AND expires_at > ?", email, time.Now()).
		Order("created_at DESC").
		First(&otp).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &otp, nil
}

func (r *OTPRepository) MarkAsUsed(id int64) error {
	return r.db.Model(&entities.OTP{}).Where("id = ?", id).Update("is_used", true).Error
}

func (r *OTPRepository) DeleteExpired() error {
	return r.db.Where("expires_at < ?", time.Now()).Delete(&entities.OTP{}).Error
}
