package entities

import (
	"time"
)

type CouponType string

const (
	CouponPercentage CouponType = "percentage"
	CouponFixed      CouponType = "fixed"
)

type Coupon struct {
	ID                 int64      `json:"id" gorm:"primaryKey"`
	Code               string     `json:"code" gorm:"uniqueIndex;not null"`
	DiscountType       CouponType `json:"discount_type" gorm:"not null"`
	DiscountValue      float64    `json:"discount_value" gorm:"not null"`
	MinimumOrderAmount float64    `json:"minimum_order_amount" gorm:"default:0"`
	ExpiryDate         time.Time  `json:"expiry_date" gorm:"not null"`
	IsActive           bool       `json:"is_active" gorm:"default:true"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}
