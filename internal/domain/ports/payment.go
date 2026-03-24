package ports

import "github.com/sawadym-stack/barca-store-clean/internal/domain/entities"

type PaymentRepository interface {
	Create(payment *entities.Payment) error
	Update(payment *entities.Payment) error
	FindByID(id int64) (*entities.Payment, error)
	FindByOrderID(orderID int64) (*entities.Payment, error)
	FindByTransactionID(transactionID string) (*entities.Payment, error)
}
