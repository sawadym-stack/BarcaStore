package entities

import "time"

type RefreshToken struct {
	ID        int64     `gorm:"primaryKey"`
	UserID    int64     `gorm:"not null;index"`
	Token     string    `gorm:"uniqueIndex;not null"`
	ExpiresAt time.Time `gorm:"not null"`
	CreatedAt time.Time
	IsRevoked bool `gorm:"default:false"`
}

func (RefreshToken) TableName() string {
	return "refresh_tokens"
}
