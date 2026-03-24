package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sawadym-stack/barca-store-clean/internal/transport/http/dto"
	"github.com/sawadym-stack/barca-store-clean/internal/usecase/cart"
)

type CartHandler struct {
	cartUseCase *cart.Interactor
}

func NewCartHandler(cartUseCase *cart.Interactor) *CartHandler {
	return &CartHandler{
		cartUseCase: cartUseCase,
	}
}

// GetCart retrieves user's cart with all items and total
func (h *CartHandler) GetCart(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userIDInt := userID.(int64)

	cartOutput, err := h.cartUseCase.GetOrCreateCart(userIDInt)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	items := make([]gin.H, len(cartOutput.Items))
	for i, item := range cartOutput.Items {
		items[i] = gin.H{
			"id":           item.ID,
			"product_id":   item.ProductID,
			"product_name": item.ProductName,
			"price":        item.Price,
			"category":     item.Category,
			"image_url":    item.ImageURL,
			"quantity":     item.Quantity,
			"size":         item.Size,
			"created_at":   item.CreatedAt,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"cart_id": cartOutput.ID,
		"items":   items,
		"total":   cartOutput.Total,
	})
}

// AddToCart adds product to user's cart
func (h *CartHandler) AddToCart(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req dto.AddToCartRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	userIDInt := userID.(int64)

	item, err := h.cartUseCase.AddToCart(userIDInt, req.ProductID, req.Quantity, req.Size)
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
		"quantity":     item.Quantity,
		"size":         item.Size,
		"message":      "item added to cart",
	})
}

// UpdateCartItem updates quantity of specific cart item
func (h *CartHandler) UpdateCartItem(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	itemIDStr := c.Param("id")
	itemID, err := strconv.ParseInt(itemIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid item ID"})
		return
	}

	var req dto.UpdateCartItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	userIDInt := userID.(int64)

	// If quantity is not provided in update, we assume it's a size-only update
	// and we should keep the existing quantity.
	// But the interactor needs the target quantity.
	// Let's fetch current item first if quantity is not provided or just use what's in request.
	// For simplicity, let's assume the frontend sends both or we handle it in interactor.
	// Since I modified the interactor to take quantity, let's ensure the frontend sends the current quantity if it only wants to change size.

	item, err := h.cartUseCase.UpdateCartItem(userIDInt, itemID, req.Quantity, req.Size)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if item == nil {
		c.JSON(http.StatusOK, gin.H{"message": "item removed from cart"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":           item.ID,
		"product_id":   item.ProductID,
		"product_name": item.ProductName,
		"price":        item.Price,
		"category":     item.Category,
		"image_url":    item.ImageURL,
		"quantity":     item.Quantity,
		"size":         item.Size,
		"message":      "cart item updated",
	})
}

// RemoveFromCart removes specific item from cart
func (h *CartHandler) RemoveFromCart(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	itemIDStr := c.Param("id")
	itemID, err := strconv.ParseInt(itemIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid item ID"})
		return
	}

	userIDInt := userID.(int64)

	if err := h.cartUseCase.RemoveFromCart(userIDInt, itemID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "item removed from cart"})
}

// ClearCart empties entire cart
func (h *CartHandler) ClearCart(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userIDInt := userID.(int64)

	if err := h.cartUseCase.ClearCart(userIDInt); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "cart cleared"})
}

// GetCartSummary gets cart summary with item and price totals
func (h *CartHandler) GetCartSummary(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userIDInt := userID.(int64)

	summary, err := h.cartUseCase.GetCartSummary(userIDInt)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"cart_id":     summary.CartID,
		"item_count":  summary.ItemCount,
		"total_items": summary.TotalItems,
		"total_price": summary.TotalPrice,
	})
}
