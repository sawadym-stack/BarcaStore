package ports

import "github.com/sawadym-stack/barca-store-clean/internal/domain/entities"

type InvoiceRepository interface {
	Create(invoice *entities.Invoice) error
	FindByID(id int64) (*entities.Invoice, error)
	FindByOrderID(orderID int64) (*entities.Invoice, error)
	Update(invoice *entities.Invoice) error
}
