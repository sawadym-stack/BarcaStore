package entities

import "time"

type InvoiceStatus string

const (
	InvoicePending  InvoiceStatus = "Pending"
	InvoicePaid     InvoiceStatus = "Paid"
	InvoiceRefunded InvoiceStatus = "Refunded"
)

type Invoice struct {
	ID                 int64         `gorm:"primaryKey"`
	OrderID            int64         `gorm:"not null;uniqueIndex"`
	UserID             int64         `gorm:"not null"`
	UserName           string        `gorm:"type:varchar(100)"`
	UserEmail          string        `gorm:"type:varchar(100)"`
	Subtotal           float64       `gorm:"not null"`
	Tax                float64       `gorm:"not null"`
	Discount           float64       `gorm:"not null;default:0"`
	FinalPayableAmount float64       `gorm:"not null"`
	PaymentStatus      InvoiceStatus `gorm:"type:varchar(20)"`
	OrderStatus        OrderStatus   `gorm:"type:varchar(20)"`
	CreatedAt          time.Time
}

func (Invoice) TableName() string {
	return "invoices"
}
