package postgres

import (
	"github.com/sawadym-stack/barca-store-clean/internal/domain/entities"
	"gorm.io/gorm"
)

type RefundRepository struct {
	db *gorm.DB
}

func NewRefundRepo(db *gorm.DB) *RefundRepository {
	return &RefundRepository{db: db}
}

func (r *RefundRepository) Create(refund *entities.Refund) error {
	return r.db.Create(refund).Error
}

func (r *RefundRepository) FindByID(id int64) (*entities.Refund, error) {
	var refund entities.Refund
	if err := r.db.First(&refund, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &refund, nil
}

func (r *RefundRepository) FindByPaymentID(paymentID int64) ([]*entities.Refund, error) {
	var refunds []*entities.Refund
	if err := r.db.Where("payment_id = ?", paymentID).Find(&refunds).Error; err != nil {
		return nil, err
	}
	return refunds, nil
}

func (r *RefundRepository) Update(refund *entities.Refund) error {
	return r.db.Save(refund).Error
}
