package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sawadym-stack/barca-store-clean/internal/transport/http/dto"
	cartuc "github.com/sawadym-stack/barca-store-clean/internal/usecase/cart"
)

type WishlistHandler struct {
	cartUC *cartuc.Interactor
}

func NewWishlistHandler(cartUC *cartuc.Interactor) *WishlistHandler {
	return &WishlistHandler{
		cartUC: cartUC,
	}
}

// GetWishlist retrieves user's wishlist
func (h *WishlistHandler) GetWishlist(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userIDInt := userID.(int64)

	wishlistOutput, err := h.cartUC.GetWishlist(userIDInt)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	items := make([]gin.H, len(wishlistOutput.Items))
	for i, item := range wishlistOutput.Items {
		items[i] = gin.H{
			"id":           item.ID,
			"product_id":   item.ProductID,
			"product_name": item.ProductName,
			"price":        item.Price,
			"category":     item.Category,
			"image_url":    item.ImageURL,
			"created_at":   item.CreatedAt,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"items": items,
		"count": len(items),
	})
}

// AddToWishlist adds product to user's wishlist
func (h *WishlistHandler) AddToWishlist(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req dto.AddToWishlistRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	userIDInt := userID.(int64)

	item, err := h.cartUC.AddToWishlist(userIDInt, req.ProductID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":           item.ID,
		"product_id":   item.ProductID,
		"product_name": item.ProductName,
		"price":        item.Price,
		"category":     item.Category,
		"image_url":    item.ImageURL,
		"message":      "product added to wishlist",
	})
}

// RemoveFromWishlist removes product from user's wishlist
func (h *WishlistHandler) RemoveFromWishlist(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	productIDStr := c.Param("product_id")
	productID, err := strconv.ParseInt(productIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid product ID"})
		return
	}

	userIDInt := userID.(int64)

	if err := h.cartUC.RemoveFromWishlist(userIDInt, productID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "product removed from wishlist"})
}

// IsInWishlist checks if product is in user's wishlist
func (h *WishlistHandler) IsInWishlist(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	productIDStr := c.Param("product_id")
	productID, err := strconv.ParseInt(productIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid product ID"})
		return
	}

	userIDInt := userID.(int64)

	exists2, err := h.cartUC.IsInWishlist(userIDInt, productID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"product_id":  productID,
		"in_wishlist": exists2,
	})
}
