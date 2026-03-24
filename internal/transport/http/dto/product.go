package dto

type CreateProductRequest struct {
	Name        string  `json:"name" binding:"required"`
	Description string  `json:"description"`
	Price       float64 `json:"price" binding:"required,gt=0"`
	StockS      int     `json:"stock_s" binding:"gte=0"`
	StockM      int     `json:"stock_m" binding:"gte=0"`
	StockL      int     `json:"stock_l" binding:"gte=0"`
	StockXL     int     `json:"stock_xl" binding:"gte=0"`
	Category    string  `json:"category" binding:"required"`
	Gender      string  `json:"gender"`
	ImageURL    string  `json:"image_url"`
}

type UpdateProductRequest struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price" binding:"omitempty,gt=0"`
	StockS      *int    `json:"stock_s" binding:"omitempty,gte=0"`
	StockM      *int    `json:"stock_m" binding:"omitempty,gte=0"`
	StockL      *int    `json:"stock_l" binding:"omitempty,gte=0"`
	StockXL     *int    `json:"stock_xl" binding:"omitempty,gte=0"`
	Category    string  `json:"category"`
	Gender      string  `json:"gender"`
	ImageURL    string  `json:"image_url"`
}

type ProductResponse struct {
	ID          int64   `json:"id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	StockS      int     `json:"stock_s"`
	StockM      int     `json:"stock_m"`
	StockL      int     `json:"stock_l"`
	StockXL     int     `json:"stock_xl"`
	Category    string  `json:"category"`
	Gender      string  `json:"gender"`
	ImageURL    string  `json:"image_url"`
	CreatedAt   string  `json:"created_at"`
	UpdatedAt   string  `json:"updated_at"`
}

type ProductListResponse struct {
	Total    int64             `json:"total"`
	Limit    int               `json:"limit"`
	Offset   int               `json:"offset"`
	Products []ProductResponse `json:"products"`
}
