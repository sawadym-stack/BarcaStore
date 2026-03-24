package entities

import "time"

type PaymentStatus string

const (
	PaymentPending           PaymentStatus = "Pending"
	PaymentSuccess           PaymentStatus = "Success"
	PaymentFailed            PaymentStatus = "Failed"
	PaymentRefunded          PaymentStatus = "Refunded"
	PaymentPartiallyRefunded PaymentStatus = "Partially_Refunded"
)

type Payment struct {
	ID            int64         `gorm:"primaryKey"`
	OrderID       int64         `gorm:"not null;index"`
	UserID        int64         `gorm:"not null;index"`
	TransactionID string        `gorm:"type:varchar(100);uniqueIndex"`
	PaymentMethod string        `gorm:"type:varchar(50)"`
	Amount        int64         `gorm:"not null"` // Amount in paise
	Currency      string        `gorm:"type:varchar(10);default:'INR'"`
	PaymentStatus PaymentStatus `gorm:"type:varchar(20);default:'Pending'"`
	PaidAt        *time.Time
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

func (Payment) TableName() string {
	return "payments"
}
