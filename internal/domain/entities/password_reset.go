package entities

import "time"

type PasswordReset struct {
	ID        int64     `gorm:"primaryKey"`
	UserID    int64     `gorm:"not null;uniqueIndex:idx_user_token"`
	Token     string    `gorm:"uniqueIndex:idx_user_token;not null"`
	ExpiresAt time.Time `gorm:"not null"`
	IsUsed    bool      `gorm:"default:false"`
	CreatedAt time.Time
}

func (PasswordReset) TableName() string {
	return "password_resets"
}
