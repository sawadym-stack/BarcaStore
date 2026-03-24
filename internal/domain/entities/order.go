package entities

import "time"

type OrderStatus string

const (
	OrderPending   OrderStatus = "pending"
	OrderConfirmed OrderStatus = "confirmed"
	OrderShipped   OrderStatus = "shipped"
	OrderDelivered OrderStatus = "delivered"
	OrderCancelled OrderStatus = "cancelled"
)

type OrderItemStatus string

const (
	OrderItemActive          OrderItemStatus = "active"
	OrderItemCancelled       OrderItemStatus = "cancelled"
	OrderItemReturned        OrderItemStatus = "returned"
	OrderItemReturnRequested OrderItemStatus = "return_requested"
	OrderItemReturnRejected  OrderItemStatus = "return_rejected"
)

type Order struct {
	ID              int64       `gorm:"primaryKey"`
	UserID          int64       `gorm:"not null;index"`
	Subtotal        float64     `gorm:"not null"`
	Tax             float64     `gorm:"not null"`
	Discount        float64     `gorm:"not null;default:0"`
	CouponCode      string      `gorm:"type:varchar(50)"`
	DeliveryCharge  float64     `gorm:"not null;default:0"`
	TotalAmount     float64     `gorm:"not null"`
	Status          OrderStatus `gorm:"type:varchar(20);default:'pending'"`
	PaymentMethod   string      `gorm:"type:varchar(50);default:'Cash on Delivery'"`
	PaymentStatus   string      `gorm:"type:varchar(20);default:'pending'"`
	ShippingName    string      `gorm:"type:varchar(100)"`
	ShippingEmail   string      `gorm:"type:varchar(100)"`
	ShippingPhone   string      `gorm:"type:varchar(20)"`
	ShippingAddress string      `gorm:"type:text"`
	ShippingCity    string      `gorm:"type:varchar(50)"`
	ShippingState   string      `gorm:"type:varchar(50)"`
	ShippingPincode string      `gorm:"type:varchar(10)"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

type OrderItem struct {
	ID                 int64           `gorm:"primaryKey"`
	OrderID            int64           `gorm:"not null;index"`
	ProductID          int64           `gorm:"not null"`
	Quantity           int             `gorm:"not null"`
	Price              float64         `gorm:"not null"`
	Size               string          `gorm:"type:varchar(10)"`
	Status             OrderItemStatus `gorm:"type:varchar(30);default:'active'"`
	RefundID           *int64          `gorm:"index"`
	ReturnReason       *string         `gorm:"type:text"`
	ReturnAdminComment *string         `gorm:"type:text"`
	CreatedAt          time.Time
}

func (Order) TableName() string {
	return "orders"
}

func (OrderItem) TableName() string {
	return "order_items"
}
