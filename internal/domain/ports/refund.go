package ports

import "github.com/sawadym-stack/barca-store-clean/internal/domain/entities"

type RefundRepository interface {
	Create(refund *entities.Refund) error
	FindByID(id int64) (*entities.Refund, error)
	FindByPaymentID(paymentID int64) ([]*entities.Refund, error)
	Update(refund *entities.Refund) error
}
