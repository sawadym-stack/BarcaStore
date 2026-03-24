package entities

import "time"

type Review struct {
	ID        int64  `gorm:"primaryKey"`
	ProductID int64  `gorm:"not null;index"`
	UserID    int64  `gorm:"not null;index"`
	Rating    int    `gorm:"default:0"` // 1-5
	Comment   string `gorm:"type:text"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

func (Review) TableName() string {
	return "reviews"
}

type ReviewWithUser struct {
	Review
	UserName    string `gorm:"column:name"`
	UserProfile string `gorm:"column:profile_photo"`
}

type ProductRating struct {
	ID        int64 `gorm:"primaryKey"`
	ProductID int64 `gorm:"not null;index"`
	UserID    int64 `gorm:"not null;index"`
	Value     int   `gorm:"type:smallint;not null"` // 1 for Like, -1 for Dislike
	CreatedAt time.Time
}

func (ProductRating) TableName() string {
	return "product_ratings"
}
