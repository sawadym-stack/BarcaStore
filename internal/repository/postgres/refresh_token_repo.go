package postgres

import (
	"time"

	"github.com/sawadym-stack/barca-store-clean/internal/domain/entities"
	"gorm.io/gorm"
)

type RefreshTokenRepo struct {
	db *gorm.DB
}

func NewRefreshTokenRepo(db *gorm.DB) *RefreshTokenRepo {
	return &RefreshTokenRepo{db: db}
}

func (r *RefreshTokenRepo) Create(token *entities.RefreshToken) error {
	return r.db.Create(token).Error
}

func (r *RefreshTokenRepo) FindByToken(token string) (*entities.RefreshToken, error) {
	var rt entities.RefreshToken
	err := r.db.Where("token = ? AND is_revoked = ? AND expires_at > ?", token, false, time.Now()).First(&rt).Error
	if err != nil {
		return nil, err
	}
	return &rt, nil
}

func (r *RefreshTokenRepo) RevokeByUserID(userID int64) error {
	return r.db.Model(&entities.RefreshToken{}).Where("user_id = ?", userID).Update("is_revoked", true).Error
}

func (r *RefreshTokenRepo) DeleteExpired() error {
	return r.db.Where("expires_at <= ?", time.Now()).Delete(&entities.RefreshToken{}).Error
}
