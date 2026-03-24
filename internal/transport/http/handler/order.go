package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sawadym-stack/barca-store-clean/internal/transport/http/dto"
	"github.com/sawadym-stack/barca-store-clean/internal/usecase/cart"
	"github.com/sawadym-stack/barca-store-clean/internal/usecase/order"
)

type OrderHandler struct {
	orderUC *order.Interactor
	cartUC  *cart.Interactor
}

func NewOrderHandler(orderUC *order.Interactor, cartUC *cart.Interactor) *OrderHandler {
	return &OrderHandler{
		orderUC: orderUC,
		cartUC:  cartUC,
	}
}

type CreateOrderRequest struct {
	Subtotal        float64            `json:"subtotal"`
	Tax             float64            `json:"tax"`
	TotalAmount     float64            `json:"total_amount"`
	PaymentMethod   string             `json:"payment_method"`
	ShippingName    string             `json:"shipping_name"`
	ShippingEmail   string             `json:"shipping_email"`
	ShippingPhone   string             `json:"shipping_phone"`
	ShippingAddress string             `json:"shipping_address"`
	ShippingCity    string             `json:"shipping_city"`
	ShippingState   string             `json:"shipping_state"`
	ShippingPincode string             `json:"shipping_pincode"`
	CouponCode      string             `json:"coupon_code"`
	Items           []OrderItemRequest `json:"items"`
}

type ShippingDetailsRequest struct {
	Name    string `json:"name"`
	Email   string `json:"email"`
	Phone   string `json:"phone"`
	Address string `json:"address"`
	City    string `json:"city"`
	State   string `json:"state"`
	Pincode string `json:"pincode"`
}

type OrderItemRequest struct {
	ProductID int64   `json:"product_id"`
	Quantity  int     `json:"quantity"`
	Price     float64 `json:"price"`
	Size      string  `json:"size"`
}

func (h *OrderHandler) CreateOrder(c *gin.Context) {
	userId, _ := c.Get("user_id")

	var req CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	items := make([]order.OrderItemInput, len(req.Items))
	for i, itm := range req.Items {
		items[i] = order.OrderItemInput{
			ProductID: itm.ProductID,
			Quantity:  itm.Quantity,
			Price:     itm.Price,
			Size:      itm.Size,
		}
	}

	input := order.CreateOrderInput{
		UserID:          userId.(int64),
		Subtotal:        req.Subtotal,
		Tax:             req.Tax,
		TotalAmount:     req.TotalAmount,
		PaymentMethod:   req.PaymentMethod,
		ShippingName:    req.ShippingName,
		ShippingEmail:   req.ShippingEmail,
		ShippingPhone:   req.ShippingPhone,
		ShippingAddress: req.ShippingAddress,
		ShippingCity:    req.ShippingCity,
		ShippingState:   req.ShippingState,
		ShippingPincode: req.ShippingPincode,
		CouponCode:      req.CouponCode,
		Items:           items,
	}

	res, err := h.orderUC.CreateOrder(input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, res)
}

type CheckoutRequest struct {
	PaymentMethod   string `json:"payment_method" binding:"required"`
	ShippingName    string `json:"shipping_name" binding:"required"`
	ShippingEmail   string `json:"shipping_email" binding:"required,email"`
	ShippingPhone   string `json:"shipping_phone" binding:"required"`
	ShippingAddress string `json:"shipping_address" binding:"required"`
	ShippingCity    string `json:"shipping_city" binding:"required"`
	ShippingState   string `json:"shipping_state" binding:"required"`
	ShippingPincode string `json:"shipping_pincode" binding:"required"`
	CouponCode      string `json:"coupon_code"`
}

func (h *OrderHandler) Checkout(c *gin.Context) {
	userId, _ := c.Get("user_id")

	var req CheckoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	// 1. Get Cart
	cartOut, err := h.cartUC.GetOrCreateCart(userId.(int64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "failed to fetch cart: " + err.Error()})
		return
	}

	if len(cartOut.Items) == 0 {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "cart is empty"})
		return
	}

	// 2. Map Cart Items to Order Items
	orderItems := make([]order.OrderItemInput, len(cartOut.Items))
	for i, item := range cartOut.Items {
		orderItems[i] = order.OrderItemInput{
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
			Size:      item.Size,
			// Note: CreateOrder interactor will fetch real current product prices
		}
	}

	// 3. Create Order
	// Note: We'll let the CreateOrder interactor handle Tax calculation logic
	// or we can pass it from frontend. Here we'll treat total as cart total + 5% tax as a placeholder
	tax := cartOut.Total * 0.05
	input := order.CreateOrderInput{
		UserID:          userId.(int64),
		Subtotal:        cartOut.Total,
		Tax:             tax,
		TotalAmount:     cartOut.Total + tax,
		PaymentMethod:   req.PaymentMethod,
		ShippingName:    req.ShippingName,
		ShippingEmail:   req.ShippingEmail,
		ShippingPhone:   req.ShippingPhone,
		ShippingAddress: req.ShippingAddress,
		ShippingCity:    req.ShippingCity,
		ShippingState:   req.ShippingState,
		ShippingPincode: req.ShippingPincode,
		CouponCode:      req.CouponCode,
		Items:           orderItems,
	}

	res, err := h.orderUC.CreateOrder(input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	// 4. Clear Cart
	h.cartUC.ClearCart(userId.(int64))

	c.JSON(http.StatusCreated, res)
}

func (h *OrderHandler) GetUserOrders(c *gin.Context) {
	userId, _ := c.Get("user_id")

	orders, err := h.orderUC.GetUserOrders(userId.(int64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, orders)
}

func (h *OrderHandler) ListAllOrders(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "10")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	orders, err := h.orderUC.ListAllOrders(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, orders)
}

func (h *OrderHandler) UpdateOrderStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, _ := strconv.ParseInt(idStr, 10, 64)

	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.orderUC.UpdateOrderStatus(id, req.Status); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "Order status updated"})
}

func (h *OrderHandler) UpdatePaymentStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, _ := strconv.ParseInt(idStr, 10, 64)

	var req struct {
		PaymentStatus string `json:"payment_status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.orderUC.UpdateOrderPaymentStatus(id, req.PaymentStatus); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "Payment status updated"})
}
