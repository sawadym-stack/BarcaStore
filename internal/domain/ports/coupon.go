package ports

import "github.com/sawadym-stack/barca-store-clean/internal/domain/entities"

type CouponRepository interface {
	Create(coupon *entities.Coupon) error
	Update(coupon *entities.Coupon) error
	Delete(id int64) error
	FindByID(id int64) (*entities.Coupon, error)
	FindByCode(code string) (*entities.Coupon, error)
	FindAll() ([]*entities.Coupon, error)
}
