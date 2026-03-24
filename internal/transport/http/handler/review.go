package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sawadym-stack/barca-store-clean/internal/transport/http/dto"
	"github.com/sawadym-stack/barca-store-clean/internal/usecase/review"
)

type ReviewHandler struct {
	reviewUC *review.Interactor
}

func NewReviewHandler(reviewUC *review.Interactor) *ReviewHandler {
	return &ReviewHandler{reviewUC: reviewUC}
}

func (h *ReviewHandler) AddReview(c *gin.Context) {
	userId, _ := c.Get("user_id")
	productIdStr := c.Param("product_id")
	if productIdStr == "" {
		productIdStr = c.Param("id")
	}
	productId, _ := strconv.ParseInt(productIdStr, 10, 64)

	var req struct {
		Rating  int    `json:"rating" binding:"required"`
		Comment string `json:"comment"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	res, err := h.reviewUC.AddReview(review.ReviewInput{
		ProductID: productId,
		UserID:    userId.(int64),
		Rating:    req.Rating,
		Comment:   req.Comment,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, res)
}

func (h *ReviewHandler) GetProductReviews(c *gin.Context) {
	productIdStr := c.Param("product_id")
	if productIdStr == "" {
		productIdStr = c.Param("id")
	}
	productId, _ := strconv.ParseInt(productIdStr, 10, 64)

	reviews, err := h.reviewUC.ListReviews(productId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	stats, _ := h.reviewUC.GetProductRatingStats(productId)

	c.JSON(http.StatusOK, gin.H{
		"reviews": reviews,
		"stats":   stats,
	})
}

func (h *ReviewHandler) UpdateReview(c *gin.Context) {
	userId, _ := c.Get("user_id")
	idStr := c.Param("id")
	id, _ := strconv.ParseInt(idStr, 10, 64)

	var req struct {
		Rating  int    `json:"rating" binding:"required"`
		Comment string `json:"comment"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.reviewUC.UpdateReview(id, userId.(int64), req.Rating, req.Comment); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "Review updated"})
}

func (h *ReviewHandler) DeleteReview(c *gin.Context) {
	userId, _ := c.Get("user_id")
	role, _ := c.Get("user_role")
	idStr := c.Param("id")
	id, _ := strconv.ParseInt(idStr, 10, 64)

	isAdmin := role.(string) == "admin"

	if err := h.reviewUC.DeleteReview(id, userId.(int64), isAdmin); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "Review deleted"})
}

func (h *ReviewHandler) RateProduct(c *gin.Context) {
	userId, _ := c.Get("user_id")
	productIdStr := c.Param("product_id")
	if productIdStr == "" {
		productIdStr = c.Param("id")
	}
	productId, _ := strconv.ParseInt(productIdStr, 10, 64)

	var req struct {
		Value int `json:"value" binding:"required"` // 1 for Like, -1 for Dislike
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.reviewUC.RateProduct(userId.(int64), productId, req.Value); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "Rating submitted"})
}

func (h *ReviewHandler) GetMyReview(c *gin.Context) {
	userId, _ := c.Get("user_id")
	productIdStr := c.Param("id")
	productId, _ := strconv.ParseInt(productIdStr, 10, 64)

	review, err := h.reviewUC.GetReviewByUserAndProduct(userId.(int64), productId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if review == nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "Review not found"})
		return
	}

	c.JSON(http.StatusOK, review)
}
