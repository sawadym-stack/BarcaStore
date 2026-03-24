package entities

import "time"

type Wishlist struct {
	ID        int64 `gorm:"primaryKey"`
	UserID    int64 `gorm:"not null;index"`
	ProductID int64 `gorm:"not null;index"`
	CreatedAt time.Time
}

func (Wishlist) TableName() string {
	return "wishlists"
}
