package postgres

import (
	"github.com/sawadym-stack/barca-store-clean/internal/domain/entities"
	"gorm.io/gorm"
)

type InvoiceRepository struct {
	db *gorm.DB
}

func NewInvoiceRepo(db *gorm.DB) *InvoiceRepository {
	return &InvoiceRepository{db: db}
}

func (r *InvoiceRepository) Create(invoice *entities.Invoice) error {
	return r.db.Create(invoice).Error
}

func (r *InvoiceRepository) FindByID(id int64) (*entities.Invoice, error) {
	var invoice entities.Invoice
	if err := r.db.First(&invoice, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &invoice, nil
}

func (r *InvoiceRepository) FindByOrderID(orderID int64) (*entities.Invoice, error) {
	var invoice entities.Invoice
	if err := r.db.Where("order_id = ?", orderID).First(&invoice).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &invoice, nil
}

func (r *InvoiceRepository) Update(invoice *entities.Invoice) error {
	return r.db.Save(invoice).Error
}
