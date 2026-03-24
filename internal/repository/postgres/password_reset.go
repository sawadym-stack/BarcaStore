package postgres

import (
	"time"

	"github.com/sawadym-stack/barca-store-clean/internal/domain/entities"
	"gorm.io/gorm"
)

type PasswordResetRepository struct {
	db *gorm.DB
}

func NewPasswordResetRepo(db *gorm.DB) *PasswordResetRepository {
	return &PasswordResetRepository{db: db}
}

func (r *PasswordResetRepository) Create(reset *entities.PasswordReset) error {
	return r.db.Create(reset).Error
}

func (r *PasswordResetRepository) FindByToken(token string) (*entities.PasswordReset, error) {
	var reset entities.PasswordReset
	if err := r.db.Where("token = ? AND is_used = false AND expires_at > ?", token, time.Now()).
		First(&reset).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &reset, nil
}

func (r *PasswordResetRepository) MarkAsUsed(id int64) error {
	return r.db.Model(&entities.PasswordReset{}).Where("id = ?", id).Update("is_used", true).Error
}

func (r *PasswordResetRepository) DeleteExpired() error {
	return r.db.Where("expires_at < ?", time.Now()).Delete(&entities.PasswordReset{}).Error
}
