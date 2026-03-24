package entities

import "time"

type Address struct {
	ID          int64     `gorm:"primaryKey" json:"id"`
	UserID      int64     `gorm:"not null" json:"user_id"`
	Name        string    `gorm:"not null" json:"name"`
	Phone       string    `gorm:"not null" json:"phone"`
	AddressLine string    `gorm:"type:text;not null" json:"address_line"`
	City        string    `gorm:"not null" json:"city"`
	State       string    `gorm:"not null" json:"state"`
	Pincode     string    `gorm:"not null" json:"pincode"`
	Country     string    `gorm:"default:'India'" json:"country"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (Address) TableName() string {
	return "addresses"
}
