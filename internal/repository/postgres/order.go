package postgres

import (
	"github.com/sawadym-stack/barca-store-clean/internal/domain/entities"
	"gorm.io/gorm"
)

type OrderRepository struct {
	db *gorm.DB
}

func NewOrderRepo(db *gorm.DB) *OrderRepository {
	return &OrderRepository{db: db}
}

func (r *OrderRepository) Create(order *entities.Order) error {
	return r.db.Create(order).Error
}

func (r *OrderRepository) CreateItem(item *entities.OrderItem) error {
	return r.db.Create(item).Error
}

func (r *OrderRepository) FindByID(id int64) (*entities.Order, error) {
	var order entities.Order
	if err := r.db.First(&order, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &order, nil
}

func (r *OrderRepository) FindByUserID(userID int64) ([]*entities.Order, error) {
	var orders []*entities.Order
	if err := r.db.Where("user_id = ?", userID).Order("created_at desc").Find(&orders).Error; err != nil {
		return nil, err
	}
	return orders, nil
}

func (r *OrderRepository) FindItemsByOrderID(orderID int64) ([]*entities.OrderItem, error) {
	var items []*entities.OrderItem
	if err := r.db.Where("order_id = ?", orderID).Find(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}

func (r *OrderRepository) FindAll(limit, offset int) ([]*entities.Order, error) {
	var orders []*entities.Order
	if err := r.db.Limit(limit).Offset(offset).Order("created_at desc").Find(&orders).Error; err != nil {
		return nil, err
	}
	return orders, nil
}

func (r *OrderRepository) CountByUserID(userID int64) (int64, error) {
	var count int64
	err := r.db.Model(&entities.Order{}).Where("user_id = ?", userID).Count(&count).Error
	return count, err
}

func (r *OrderRepository) UpdateStatus(id int64, status entities.OrderStatus) error {
	return r.db.Model(&entities.Order{}).Where("id = ?", id).Update("status", status).Error
}

func (r *OrderRepository) UpdatePaymentStatus(id int64, status string) error {
	return r.db.Model(&entities.Order{}).Where("id = ?", id).Update("payment_status", status).Error
}

func (r *OrderRepository) FindItemByID(id int64) (*entities.OrderItem, error) {
	var item entities.OrderItem
	if err := r.db.First(&item, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &item, nil
}

func (r *OrderRepository) UpdateItem(item *entities.OrderItem) error {
	return r.db.Save(item).Error
}

func (r *OrderRepository) Update(order *entities.Order) error {
	return r.db.Save(order).Error
}
func (r *OrderRepository) HasUserPurchasedProduct(userID, productID int64) (bool, error) {
	var count int64
	err := r.db.Table("orders").
		Joins("JOIN order_items ON order_items.order_id = orders.id").
		Where("orders.user_id = ? AND order_items.product_id = ? AND LOWER(orders.status) = 'delivered'", userID, productID).
		Count(&count).Error
	return count > 0, err
}
