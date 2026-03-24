package entities

import "time"

type OTP struct {
	ID        int64     `gorm:"primaryKey"`
	Email     string    `gorm:"uniqueIndex;not null"`
	Code      string    `gorm:"not null"`
	ExpiresAt time.Time `gorm:"not null"`
	IsUsed    bool      `gorm:"default:false"`
	CreatedAt time.Time
}

func (OTP) TableName() string {
	return "otps"
}
