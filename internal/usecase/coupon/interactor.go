package coupon

import (
	"errors"
	"time"

	"github.com/sawadym-stack/barca-store-clean/internal/domain/entities"
	"github.com/sawadym-stack/barca-store-clean/internal/domain/ports"
)

type Interactor struct {
	couponRepo ports.CouponRepository
}

func NewInteractor(couponRepo ports.CouponRepository) *Interactor {
	return &Interactor{
		couponRepo: couponRepo,
	}
}

func (i *Interactor) CreateCoupon(coupon *entities.Coupon) error {
	return i.couponRepo.Create(coupon)
}

func (i *Interactor) UpdateCoupon(coupon *entities.Coupon) error {
	return i.couponRepo.Update(coupon)
}

func (i *Interactor) DeleteCoupon(id int64) error {
	return i.couponRepo.Delete(id)
}

func (i *Interactor) ListCoupons() ([]*entities.Coupon, error) {
	return i.couponRepo.FindAll()
}

func (i *Interactor) ValidateAndApply(code string, subtotal float64) (*entities.Coupon, float64, error) {
	coupon, err := i.couponRepo.FindByCode(code)
	if err != nil || coupon == nil {
		return nil, 0, errors.New("invalid coupon code")
	}

	if !coupon.IsActive {
		return nil, 0, errors.New("coupon is inactive")
	}

	if time.Now().After(coupon.ExpiryDate) {
		return nil, 0, errors.New("coupon has expired")
	}

	if subtotal < coupon.MinimumOrderAmount {
		return nil, 0, errors.New("order amount too low for this coupon")
	}

	var discountAmount float64
	if coupon.DiscountType == entities.CouponPercentage {
		discountAmount = subtotal * (coupon.DiscountValue / 100)
	} else {
		discountAmount = coupon.DiscountValue
	}

	// Ensure discount doesn't exceed subtotal
	if discountAmount > subtotal {
		discountAmount = subtotal
	}

	return coupon, discountAmount, nil
}
