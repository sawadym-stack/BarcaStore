package postgres

import (
	"time"

	"github.com/sawadym-stack/barca-store-clean/internal/domain/entities"
	"gorm.io/gorm"
)

type PendingRegistrationRepo struct {
	db *gorm.DB
}

func NewPendingRegistrationRepo(db *gorm.DB) *PendingRegistrationRepo {
	return &PendingRegistrationRepo{db: db}
}

func (r *PendingRegistrationRepo) Create(pending *entities.PendingRegistration) error {
	// Delete any existing pending registration for this email to avoid unique constraint violation
	r.db.Where("email = ?", pending.Email).Delete(&entities.PendingRegistration{})
	return r.db.Create(pending).Error
}

func (r *PendingRegistrationRepo) FindByEmailAndCode(email, code string) (*entities.PendingRegistration, error) {
	var pending entities.PendingRegistration
	err := r.db.Where("email = ? AND code = ? AND expires_at > ?", email, code, time.Now()).First(&pending).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &pending, nil
}

func (r *PendingRegistrationRepo) DeleteByEmail(email string) error {
	return r.db.Where("email = ?", email).Delete(&entities.PendingRegistration{}).Error
}

func (r *PendingRegistrationRepo) DeleteExpired() error {
	return r.db.Where("expires_at < ?", time.Now()).Delete(&entities.PendingRegistration{}).Error
}
