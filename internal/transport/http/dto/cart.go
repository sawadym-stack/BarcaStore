package dto

type AddToCartRequest struct {
	ProductID int64  `json:"product_id" binding:"required"`
	Quantity  int    `json:"quantity" binding:"required,gt=0"`
	Size      string `json:"size"`
}

type UpdateCartItemRequest struct {
	Quantity int    `json:"quantity"`
	Size     string `json:"size"`
}

type CartItemResponse struct {
	ID          int64   `json:"id"`
	CartID      int64   `json:"cart_id"`
	ProductID   int64   `json:"product_id"`
	ProductName string  `json:"product_name"`
	Price       float64 `json:"price"`
	Category    string  `json:"category"`
	ImageURL    string  `json:"image_url"`
	Quantity    int     `json:"quantity"`
	Size        string  `json:"size"`
	CreatedAt   string  `json:"created_at"`
}

type CartResponse struct {
	ID    int64              `json:"id"`
	Items []CartItemResponse `json:"items"`
	Total float64            `json:"total"`
}

type CartSummaryResponse struct {
	CartID     int64   `json:"cart_id"`
	ItemCount  int     `json:"item_count"`
	TotalPrice float64 `json:"total_price"`
	TotalItems int     `json:"total_items"`
}

// ============= Wishlist DTOs =============

type AddToWishlistRequest struct {
	ProductID int64 `json:"product_id" binding:"required"`
}

type WishlistItemResponse struct {
	ID        int64   `json:"id"`
	ProductID int64   `json:"product_id"`
	Name      string  `json:"name"`
	Price     float64 `json:"price"`
	Category  string  `json:"category"`
	ImageURL  string  `json:"image_url"`
	CreatedAt string  `json:"created_at"`
}

type WishlistResponse struct {
	UserID int64                  `json:"user_id"`
	Items  []WishlistItemResponse `json:"items"`
}
