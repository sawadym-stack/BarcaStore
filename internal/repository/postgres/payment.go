package postgres

import (
	"github.com/sawadym-stack/barca-store-clean/internal/domain/entities"
	"gorm.io/gorm"
)

type PaymentRepository struct {
	db *gorm.DB
}

func NewPaymentRepo(db *gorm.DB) *PaymentRepository {
	return &PaymentRepository{db: db}
}

func (r *PaymentRepository) Create(payment *entities.Payment) error {
	return r.db.Create(payment).Error
}

func (r *PaymentRepository) Update(payment *entities.Payment) error {
	return r.db.Save(payment).Error
}

func (r *PaymentRepository) FindByID(id int64) (*entities.Payment, error) {
	var payment entities.Payment
	if err := r.db.First(&payment, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &payment, nil
}

func (r *PaymentRepository) FindByOrderID(orderID int64) (*entities.Payment, error) {
	var payment entities.Payment
	if err := r.db.Where("order_id = ?", orderID).First(&payment).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &payment, nil
}

func (r *PaymentRepository) FindByTransactionID(transactionID string) (*entities.Payment, error) {
	var payment entities.Payment
	if err := r.db.Where("transaction_id = ?", transactionID).First(&payment).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &payment, nil
}
