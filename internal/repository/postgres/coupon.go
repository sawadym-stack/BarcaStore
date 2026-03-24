package postgres

import (
	"github.com/sawadym-stack/barca-store-clean/internal/domain/entities"
	"gorm.io/gorm"
)

type CouponRepository struct {
	db *gorm.DB
}

func NewCouponRepo(db *gorm.DB) *CouponRepository {
	return &CouponRepository{db: db}
}

func (r *CouponRepository) Create(coupon *entities.Coupon) error {
	return r.db.Create(coupon).Error
}

func (r *CouponRepository) Update(coupon *entities.Coupon) error {
	return r.db.Save(coupon).Error
}

func (r *CouponRepository) Delete(id int64) error {
	return r.db.Delete(&entities.Coupon{}, id).Error
}

func (r *CouponRepository) FindByID(id int64) (*entities.Coupon, error) {
	var coupon entities.Coupon
	if err := r.db.First(&coupon, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &coupon, nil
}

func (r *CouponRepository) FindByCode(code string) (*entities.Coupon, error) {
	var coupon entities.Coupon
	if err := r.db.Where("code = ?", code).First(&coupon).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &coupon, nil
}

func (r *CouponRepository) FindAll() ([]*entities.Coupon, error) {
	var coupons []*entities.Coupon
	if err := r.db.Find(&coupons).Error; err != nil {
		return nil, err
	}
	return coupons, nil
}
