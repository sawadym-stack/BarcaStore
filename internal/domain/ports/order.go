package ports

import "github.com/sawadym-stack/barca-store-clean/internal/domain/entities"

type OrderRepository interface {
	Create(order *entities.Order) error
	CreateItem(item *entities.OrderItem) error
	FindByID(id int64) (*entities.Order, error)
	FindByUserID(userID int64) ([]*entities.Order, error)
	FindItemsByOrderID(orderID int64) ([]*entities.OrderItem, error)
	FindAll(limit, offset int) ([]*entities.Order, error)
	CountByUserID(userID int64) (int64, error)
	UpdateStatus(id int64, status entities.OrderStatus) error
	UpdatePaymentStatus(id int64, status string) error

	FindItemByID(id int64) (*entities.OrderItem, error)
	UpdateItem(item *entities.OrderItem) error
	Update(order *entities.Order) error
	HasUserPurchasedProduct(userID, productID int64) (bool, error)
}
