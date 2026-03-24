package review

import (
	"errors"
	"time"

	"github.com/sawadym-stack/barca-store-clean/internal/domain/entities"
	"github.com/sawadym-stack/barca-store-clean/internal/domain/ports"
)

type Interactor struct {
	reviewRepo  ports.ReviewRepository
	productRepo ports.ProductRepository
	orderRepo   ports.OrderRepository
}

func NewInteractor(reviewRepo ports.ReviewRepository, productRepo ports.ProductRepository, orderRepo ports.OrderRepository) *Interactor {
	return &Interactor{
		reviewRepo:  reviewRepo,
		productRepo: productRepo,
		orderRepo:   orderRepo,
	}
}

type ReviewInput struct {
	ProductID int64  `json:"product_id"`
	UserID    int64  `json:"user_id"`
	Rating    int    `json:"rating"`
	Comment   string `json:"comment"`
}

type ReviewResponse struct {
	ID        int64     `json:"id"`
	ProductID int64     `json:"product_id"`
	UserID    int64     `json:"user_id"`
	UserName  string    `json:"user_name,omitempty"`
	UserPhoto string    `json:"user_photo,omitempty"`
	Rating    int       `json:"rating"`
	Comment   string    `json:"comment"`
	CreatedAt time.Time `json:"created_at"`
}

func (i *Interactor) AddReview(input ReviewInput) (*ReviewResponse, error) {
	if input.Rating < 1 || input.Rating > 5 {
		return nil, errors.New("rating must be between 1 and 5")
	}

	// 1. Verify product exists
	product, err := i.productRepo.FindByID(input.ProductID)
	if err != nil || product == nil {
		return nil, errors.New("product not found")
	}

	// 2. Verify user has purchased the product
	purchased, err := i.orderRepo.HasUserPurchasedProduct(input.UserID, input.ProductID)
	if err != nil {
		return nil, err
	}
	if !purchased {
		return nil, errors.New("you can only review products you have purchased and received")
	}

	// 3. Verify user hasn't already reviewed this product
	existing, err := i.reviewRepo.FindByUserAndProduct(input.UserID, input.ProductID)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, errors.New("you have already reviewed this product")
	}

	review := &entities.Review{
		ProductID: input.ProductID,
		UserID:    input.UserID,
		Rating:    input.Rating,
		Comment:   input.Comment,
	}

	if err := i.reviewRepo.Create(review); err != nil {
		return nil, err
	}

	return &ReviewResponse{
		ID:        review.ID,
		ProductID: review.ProductID,
		UserID:    review.UserID,
		Rating:    review.Rating,
		Comment:   review.Comment,
		CreatedAt: review.CreatedAt,
	}, nil
}

func (i *Interactor) ListReviews(productID int64) ([]*ReviewResponse, error) {
	reviews, err := i.reviewRepo.FindByProductID(productID)
	if err != nil {
		return nil, err
	}

	var res []*ReviewResponse
	for _, r := range reviews {
		res = append(res, &ReviewResponse{
			ID:        r.ID,
			ProductID: r.ProductID,
			UserID:    r.UserID,
			UserName:  r.UserName,
			UserPhoto: r.UserProfile,
			Rating:    r.Rating,
			Comment:   r.Comment,
			CreatedAt: r.CreatedAt,
		})
	}
	return res, nil
}

func (i *Interactor) GetReviewByUserAndProduct(userID, productID int64) (*ReviewResponse, error) {
	r, err := i.reviewRepo.FindByUserAndProduct(userID, productID)
	if err != nil {
		return nil, err
	}
	if r == nil {
		return nil, nil
	}
	return &ReviewResponse{
		ID:        r.ID,
		ProductID: r.ProductID,
		UserID:    r.UserID,
		Rating:    r.Rating,
		Comment:   r.Comment,
		CreatedAt: r.CreatedAt,
	}, nil
}

func (i *Interactor) UpdateReview(id, userID int64, rating int, comment string) error {
	review, err := i.reviewRepo.FindByID(id)
	if err != nil {
		return err
	}

	if review.UserID != userID {
		return errors.New("unauthorized to update this review")
	}

	review.Rating = rating
	review.Comment = comment
	return i.reviewRepo.Update(review)
}

func (i *Interactor) DeleteReview(id, userID int64, isAdmin bool) error {
	review, err := i.reviewRepo.FindByID(id)
	if err != nil {
		return err
	}

	if !isAdmin && review.UserID != userID {
		return errors.New("unauthorized to delete this review")
	}

	return i.reviewRepo.Delete(id)
}

func (i *Interactor) RateProduct(userID, productID int64, value int) error {
	if value != 1 && value != -1 {
		return errors.New("invalid rating value")
	}

	// Verify product exists
	product, err := i.productRepo.FindByID(productID)
	if err != nil || product == nil {
		return errors.New("product not found")
	}

	rating := &entities.ProductRating{
		UserID:    userID,
		ProductID: productID,
		Value:     value,
	}

	return i.reviewRepo.RateProduct(rating)
}

func (i *Interactor) GetProductRatingStats(productID int64) (map[string]interface{}, error) {
	avg, _ := i.reviewRepo.GetAverageRating(productID)
	likes, dislikes, _ := i.reviewRepo.GetProductRatings(productID)

	return map[string]interface{}{
		"average_rating": avg,
		"likes":          likes,
		"dislikes":       dislikes,
	}, nil
}
