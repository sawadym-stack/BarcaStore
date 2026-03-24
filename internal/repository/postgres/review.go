package postgres

import (
	"github.com/sawadym-stack/barca-store-clean/internal/domain/entities"
	"gorm.io/gorm"
)

type ReviewRepo struct {
	db *gorm.DB
}

func NewReviewRepo(db *gorm.DB) *ReviewRepo {
	return &ReviewRepo{db: db}
}

func (r *ReviewRepo) Create(review *entities.Review) error {
	return r.db.Create(review).Error
}

func (r *ReviewRepo) Update(review *entities.Review) error {
	return r.db.Save(review).Error
}

func (r *ReviewRepo) Delete(id int64) error {
	return r.db.Delete(&entities.Review{}, id).Error
}

func (r *ReviewRepo) FindByID(id int64) (*entities.Review, error) {
	var review entities.Review
	if err := r.db.First(&review, id).Error; err != nil {
		return nil, err
	}
	return &review, nil
}

func (r *ReviewRepo) FindByProductID(productID int64) ([]*entities.ReviewWithUser, error) {
	var results []*entities.ReviewWithUser
	err := r.db.Table("reviews").
		Select("reviews.*, users.name, users.profile_photo").
		Joins("left join users on users.id = reviews.user_id").
		Where("reviews.product_id = ?", productID).
		Order("reviews.created_at desc").
		Scan(&results).Error
	if err != nil {
		return nil, err
	}
	return results, nil
}

func (r *ReviewRepo) GetAverageRating(productID int64) (float64, error) {
	var avg float64
	err := r.db.Model(&entities.Review{}).Where("product_id = ?", productID).Select("AVG(rating)").Scan(&avg).Error
	return avg, err
}

func (r *ReviewRepo) RateProduct(rating *entities.ProductRating) error {
	// Upsert rating (one per user per product)
	return r.db.Where(entities.ProductRating{UserID: rating.UserID, ProductID: rating.ProductID}).
		Assign(entities.ProductRating{Value: rating.Value}).
		FirstOrCreate(rating).Error
}

func (r *ReviewRepo) GetProductRatings(productID int64) (likes, dislikes int, err error) {
	var l, d int64
	if err := r.db.Model(&entities.ProductRating{}).Where("product_id = ? AND value = 1", productID).Count(&l).Error; err != nil {
		return 0, 0, err
	}
	if err := r.db.Model(&entities.ProductRating{}).Where("product_id = ? AND value = -1", productID).Count(&d).Error; err != nil {
		return 0, 0, err
	}
	return int(l), int(d), nil
}

func (r *ReviewRepo) FindByUserAndProduct(userID, productID int64) (*entities.Review, error) {
	var review entities.Review
	err := r.db.Where("user_id = ? AND product_id = ?", userID, productID).First(&review).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &review, nil
}
