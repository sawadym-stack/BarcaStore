package migration

import (
	"github.com/sawadym-stack/barca-store-clean/internal/domain/entities"
	"gorm.io/gorm"
)

func RunAutoMigrate(db *gorm.DB) error {
	if err := db.AutoMigrate(
		&entities.User{},
		&entities.OTP{},
		&entities.PasswordReset{},
		&entities.Product{},
		&entities.Cart{},
		&entities.CartItem{},
		&entities.Order{},
		&entities.OrderItem{},
		&entities.Wishlist{},
		&entities.Review{},
		&entities.RefreshToken{},
		&entities.ProductRating{},
		&entities.PendingRegistration{},
		&entities.Payment{},
		&entities.Invoice{},
		&entities.Refund{},
		&entities.Coupon{},
		&entities.Address{},
	); err != nil {
		return err
	}

	// Promote admin@gmail.com to Super Admin if it exists
	return db.Model(&entities.User{}).Where("email = ?", "admin@gmail.com").Update("role", entities.RoleSuperAdmin).Error
}
