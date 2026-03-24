package entities

import "time"

type Cart struct {
	ID        int64 `gorm:"primaryKey"`
	UserID    int64 `gorm:"not null;uniqueIndex"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

type CartItem struct {
	ID        int64  `gorm:"primaryKey"`
	CartID    int64  `gorm:"not null;index"`
	ProductID int64  `gorm:"not null"`
	Quantity  int    `gorm:"not null;default:1"`
	Size      string `gorm:"type:varchar(10)"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

func (Cart) TableName() string {
	return "carts"
}

func (CartItem) TableName() string {
	return "cart_items"
}
