package entities

import (
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"
)

type Product struct {
	ID          int64   `gorm:"primaryKey"`
	Name        string  `gorm:"not null;index"`
	Description string  `gorm:"type:text"`
	Price       float64 `gorm:"not null"`
	StockS      int     `gorm:"not null;default:0"`
	StockM      int     `gorm:"not null;default:0"`
	StockL      int     `gorm:"not null;default:0"`
	StockXL     int     `gorm:"not null;default:0"`
	Category    string  `gorm:"index"`
	Gender      string  `gorm:"index"`
	ImageURL    string
	CreatedAt   time.Time
	UpdatedAt   time.Time
	DeletedAt   gorm.DeletedAt `gorm:"index"`
}

// GetStockBySize returns stock for specific size
func (p *Product) GetStockBySize(size string) int {
	switch strings.ToUpper(size) {
	case "S":
		return p.StockS
	case "M":
		return p.StockM
	case "L":
		return p.StockL
	case "XL":
		return p.StockXL
	default:
		return 0
	}
}

// UpdateStockBySize updates stock for specific size
func (p *Product) UpdateStockBySize(size string, quantity int) error {
	switch strings.ToUpper(size) {
	case "S":
		p.StockS += quantity
	case "M":
		p.StockM += quantity
	case "L":
		p.StockL += quantity
	case "XL":
		p.StockXL += quantity
	default:
		return ErrInvalidSize
	}
	return nil
}

func (Product) TableName() string {
	return "products"
}

var (
	ErrInvalidSize = errors.New("invalid size: must be S, M, L, or XL")
)
