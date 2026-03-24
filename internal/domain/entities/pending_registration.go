package entities

import "time"

type PendingRegistration struct {
	ID        int64     `gorm:"primaryKey"`
	Email     string    `gorm:"uniqueIndex;not null"`
	Password  string    `gorm:"not null"`
	Name      string    `gorm:"not null"`
	Code      string    `gorm:"not null"`
	ExpiresAt time.Time `gorm:"not null"`
	CreatedAt time.Time
}

func (PendingRegistration) TableName() string {
	return "pending_registrations"
}
