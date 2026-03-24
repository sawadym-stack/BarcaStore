package entities

import "time"

type RefundStatus string

const (
	RefundInitiated RefundStatus = "Initiated"
	RefundCompleted RefundStatus = "Completed"
	RefundFailed    RefundStatus = "Failed"
)

type Refund struct {
	ID            int64        `gorm:"primaryKey"`
	PaymentID     int64        `gorm:"not null;index"`
	OrderItemID   *int64       `gorm:"index"` // Nullable for full refund
	TransactionID string       `gorm:"type:varchar(100);uniqueIndex"`
	RefundAmount  int64        `gorm:"not null"` // Amount in paise
	RefundStatus  RefundStatus `gorm:"type:varchar(20);default:'Initiated'"`
	CreatedAt     time.Time
}

func (Refund) TableName() string {
	return "refunds"
}
