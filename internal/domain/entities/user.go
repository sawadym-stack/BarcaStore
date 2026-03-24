package entities

import "time"

type UserRole string

const (
	RoleUser       UserRole = "user"
	RoleAdmin      UserRole = "admin"
	RoleSuperAdmin UserRole = "superadmin"
)

type User struct {
	ID            int64    `gorm:"primaryKey"`
	Email         string   `gorm:"uniqueIndex;not null"`
	Password      string   `gorm:"not null"`
	Name          string   `gorm:"not null"`
	Role          UserRole `gorm:"type:varchar(10);default:'user'"`
	IsBlocked     bool     `gorm:"default:false"`
	IsVerified    bool     `gorm:"default:false"`
	ProfilePhoto  string   `gorm:"type:varchar(255)"`
	WalletBalance float64  `gorm:"default:0"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

func (User) TableName() string {
	return "users"
}
