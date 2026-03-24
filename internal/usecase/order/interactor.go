package order

import (
	"errors"
	"strings"
	"time"

	"github.com/sawadym-stack/barca-store-clean/internal/domain/entities"
	"github.com/sawadym-stack/barca-store-clean/internal/domain/ports"
)

type Interactor struct {
	orderRepo   ports.OrderRepository
	productRepo ports.ProductRepository
	couponRepo  ports.CouponRepository
	paymentRepo ports.PaymentRepository
}

func NewInteractor(orderRepo ports.OrderRepository, productRepo ports.ProductRepository, couponRepo ports.CouponRepository, paymentRepo ports.PaymentRepository) *Interactor {
	return &Interactor{
		orderRepo:   orderRepo,
		productRepo: productRepo,
		couponRepo:  couponRepo,
		paymentRepo: paymentRepo,
	}
}

type OrderItemInput struct {
	ProductID int64   `json:"product_id"`
	Quantity  int     `json:"quantity"`
	Price     float64 `json:"price"`
	Size      string  `json:"size"`
}

type CreateOrderInput struct {
	UserID          int64            `json:"user_id"`
	Subtotal        float64          `json:"subtotal"`
	Tax             float64          `json:"tax"`
	TotalAmount     float64          `json:"total_amount"`
	PaymentMethod   string           `json:"payment_method"`
	ShippingName    string           `json:"shipping_name"`
	ShippingEmail   string           `json:"shipping_email"`
	ShippingPhone   string           `json:"shipping_phone"`
	ShippingAddress string           `json:"shipping_address"`
	ShippingCity    string           `json:"shipping_city"`
	ShippingState   string           `json:"shipping_state"`
	ShippingPincode string           `json:"shipping_pincode"`
	CouponCode      string           `json:"coupon_code"`
	Items           []OrderItemInput `json:"items"`
}

type OrderItemResponse struct {
	ID                 int64   `json:"id"`
	ProductID          int64   `json:"product_id"`
	Name               string  `json:"name"`
	ImageURL           string  `json:"image_url"`
	Quantity           int     `json:"quantity"`
	Price              float64 `json:"price"`
	Size               string  `json:"size"`
	Status             string  `json:"status"`
	RefundID           *int64  `json:"refund_id"`
	ReturnReason       *string `json:"return_reason"`
	ReturnAdminComment *string `json:"return_admin_comment"`
}

type OrderResponse struct {
	ID              int64               `json:"id"`
	UserID          int64               `json:"user_id"`
	Subtotal        float64             `json:"subtotal"`
	Tax             float64             `json:"tax"`
	Discount        float64             `json:"discount"`
	DeliveryCharge  float64             `json:"delivery_charge"`
	TotalAmount     float64             `json:"total_amount"`
	Status          string              `json:"status"`
	PaymentMethod   string              `json:"payment_method"`
	PaymentStatus   string              `json:"payment_status"`
	ShippingName    string              `json:"shipping_name"`
	ShippingEmail   string              `json:"shipping_email"`
	ShippingPhone   string              `json:"shipping_phone"`
	ShippingAddress string              `json:"shipping_address"`
	ShippingCity    string              `json:"shipping_city"`
	ShippingState   string              `json:"shipping_state"`
	ShippingPincode string              `json:"shipping_pincode"`
	CreatedAt       time.Time           `json:"created_at"`
	Items           []OrderItemResponse `json:"items"`
}

func (i *Interactor) CreateOrder(input CreateOrderInput) (*OrderResponse, error) {
	if len(input.Items) == 0 {
		return nil, errors.New("order must have at least one item")
	}

	var calculatedSubtotal float64
	products := make(map[int64]*entities.Product)

	for _, itemInput := range input.Items {
		product, err := i.productRepo.FindByID(itemInput.ProductID)
		if err != nil || product == nil {
			return nil, errors.New("product not found")
		}
		// Check stock for specific size
		stock := 0
		switch strings.ToUpper(itemInput.Size) {
		case "S":
			stock = product.StockS
		case "M":
			stock = product.StockM
		case "L":
			stock = product.StockL
		case "XL":
			stock = product.StockXL
		default:
			return nil, errors.New("invalid size specified for product: " + product.Name)
		}

		if stock < itemInput.Quantity {
			return nil, errors.New("insufficient stock for size " + itemInput.Size + " of product: " + product.Name)
		}
		products[itemInput.ProductID] = product
		calculatedSubtotal += product.Price * float64(itemInput.Quantity)
	}

	discount := 0.0
	if input.CouponCode != "" {
		coupon, err := i.couponRepo.FindByCode(input.CouponCode)
		if err == nil && coupon != nil && coupon.IsActive && time.Now().Before(coupon.ExpiryDate) && calculatedSubtotal >= coupon.MinimumOrderAmount {
			if coupon.DiscountType == entities.CouponPercentage {
				discount = calculatedSubtotal * (coupon.DiscountValue / 100)
			} else {
				discount = coupon.DiscountValue
			}
			if discount > calculatedSubtotal {
				discount = calculatedSubtotal
			}
		}
	}

	deliveryCharge := 0.0
	if calculatedSubtotal < 5000 {
		deliveryCharge = 250.0
	}
	tax := calculatedSubtotal * 0.18
	calculatedTotal := calculatedSubtotal - discount + deliveryCharge + tax

	order := &entities.Order{
		UserID:          input.UserID,
		Subtotal:        calculatedSubtotal,
		Tax:             tax,
		Discount:        discount,
		CouponCode:      input.CouponCode,
		DeliveryCharge:  deliveryCharge,
		TotalAmount:     calculatedTotal,
		PaymentMethod:   input.PaymentMethod,
		ShippingName:    input.ShippingName,
		ShippingEmail:   input.ShippingEmail,
		ShippingPhone:   input.ShippingPhone,
		ShippingAddress: input.ShippingAddress,
		ShippingCity:    input.ShippingCity,
		ShippingState:   input.ShippingState,
		ShippingPincode: input.ShippingPincode,
		Status:          entities.OrderPending,
	}

	if err := i.orderRepo.Create(order); err != nil {
		return nil, err
	}

	var itemsResponse []OrderItemResponse
	for _, itemInput := range input.Items {
		product := products[itemInput.ProductID]

		item := &entities.OrderItem{
			OrderID:   order.ID,
			ProductID: itemInput.ProductID,
			Quantity:  itemInput.Quantity,
			Price:     product.Price,
			Size:      itemInput.Size,
		}
		if err := i.orderRepo.CreateItem(item); err != nil {
			return nil, err
		}

		// Update size-specific stock
		if err := i.productRepo.UpdateStock(product.ID, itemInput.Size, -itemInput.Quantity); err != nil {
			return nil, err
		}

		itemsResponse = append(itemsResponse, OrderItemResponse{
			ID:                 item.ID,
			ProductID:          item.ProductID,
			Name:               product.Name,
			ImageURL:           product.ImageURL,
			Quantity:           item.Quantity,
			Price:              item.Price,
			Size:               item.Size,
			Status:             string(item.Status),
			RefundID:           item.RefundID,
			ReturnReason:       item.ReturnReason,
			ReturnAdminComment: item.ReturnAdminComment,
		})
	}

	return &OrderResponse{
		ID:              order.ID,
		UserID:          order.UserID,
		Subtotal:        order.Subtotal,
		Tax:             order.Tax,
		Discount:        order.Discount,
		DeliveryCharge:  order.DeliveryCharge,
		TotalAmount:     order.TotalAmount,
		Status:          string(order.Status),
		PaymentMethod:   order.PaymentMethod,
		PaymentStatus:   order.PaymentStatus,
		ShippingName:    order.ShippingName,
		ShippingEmail:   order.ShippingEmail,
		ShippingPhone:   order.ShippingPhone,
		ShippingAddress: order.ShippingAddress,
		ShippingCity:    order.ShippingCity,
		ShippingState:   order.ShippingState,
		ShippingPincode: order.ShippingPincode,
		CreatedAt:       order.CreatedAt,
		Items:           itemsResponse,
	}, nil
}

func (i *Interactor) GetUserOrders(userID int64) ([]*OrderResponse, error) {
	orders, err := i.orderRepo.FindByUserID(userID)
	if err != nil {
		return nil, err
	}

	response := make([]*OrderResponse, 0)
	for _, order := range orders {
		items, _ := i.orderRepo.FindItemsByOrderID(order.ID)
		var itemsResponse []OrderItemResponse
		for _, item := range items {
			product, _ := i.productRepo.FindByID(item.ProductID)
			name := "Unknown Product"
			img := ""
			if product != nil {
				name = product.Name
				img = product.ImageURL
			}
			itemsResponse = append(itemsResponse, OrderItemResponse{
				ID:                 item.ID,
				ProductID:          item.ProductID,
				Name:               name,
				ImageURL:           img,
				Quantity:           item.Quantity,
				Price:              item.Price,
				Size:               item.Size,
				Status:             string(item.Status),
				RefundID:           item.RefundID,
				ReturnReason:       item.ReturnReason,
				ReturnAdminComment: item.ReturnAdminComment,
			})
		}

		response = append(response, &OrderResponse{
			ID:              order.ID,
			UserID:          order.UserID,
			Subtotal:        order.Subtotal,
			Tax:             order.Tax,
			Discount:        order.Discount,
			DeliveryCharge:  order.DeliveryCharge,
			TotalAmount:     order.TotalAmount,
			Status:          string(order.Status),
			PaymentMethod:   order.PaymentMethod,
			PaymentStatus:   order.PaymentStatus,
			ShippingName:    order.ShippingName,
			ShippingEmail:   order.ShippingEmail,
			ShippingPhone:   order.ShippingPhone,
			ShippingAddress: order.ShippingAddress,
			ShippingCity:    order.ShippingCity,
			ShippingState:   order.ShippingState,
			ShippingPincode: order.ShippingPincode,
			CreatedAt:       order.CreatedAt,
			Items:           itemsResponse,
		})
	}

	return response, nil
}

func (i *Interactor) ListAllOrders(limit, offset int) ([]*OrderResponse, error) {
	orders, err := i.orderRepo.FindAll(limit, offset)
	if err != nil {
		return nil, err
	}

	response := make([]*OrderResponse, 0)
	for _, order := range orders {
		items, _ := i.orderRepo.FindItemsByOrderID(order.ID)
		var itemsResponse []OrderItemResponse
		for _, item := range items {
			product, _ := i.productRepo.FindByID(item.ProductID)
			name := "Unknown Product"
			img := ""
			if product != nil {
				name = product.Name
				img = product.ImageURL
			}
			itemsResponse = append(itemsResponse, OrderItemResponse{
				ID:                 item.ID,
				ProductID:          item.ProductID,
				Name:               name,
				ImageURL:           img,
				Quantity:           item.Quantity,
				Price:              item.Price,
				Size:               item.Size,
				Status:             string(item.Status),
				RefundID:           item.RefundID,
				ReturnReason:       item.ReturnReason,
				ReturnAdminComment: item.ReturnAdminComment,
			})
		}
		response = append(response, &OrderResponse{
			ID:              order.ID,
			UserID:          order.UserID,
			Subtotal:        order.Subtotal,
			Tax:             order.Tax,
			Discount:        order.Discount,
			DeliveryCharge:  order.DeliveryCharge,
			TotalAmount:     order.TotalAmount,
			Status:          string(order.Status),
			PaymentMethod:   order.PaymentMethod,
			PaymentStatus:   order.PaymentStatus,
			ShippingName:    order.ShippingName,
			ShippingEmail:   order.ShippingEmail,
			ShippingPhone:   order.ShippingPhone,
			ShippingAddress: order.ShippingAddress,
			ShippingCity:    order.ShippingCity,
			ShippingState:   order.ShippingState,
			ShippingPincode: order.ShippingPincode,
			CreatedAt:       order.CreatedAt,
			Items:           itemsResponse,
		})
	}

	return response, nil
}

func (i *Interactor) GetOrderCountByUserID(userID int64) (int64, error) {
	return i.orderRepo.CountByUserID(userID)
}

func (i *Interactor) UpdateOrderStatus(id int64, status string) error {
	order, err := i.orderRepo.FindByID(id)
	if err != nil || order == nil {
		return errors.New("order not found")
	}
	if order.Status == entities.OrderCancelled {
		return errors.New("cannot change status of a cancelled order")
	}
	if order.Status == entities.OrderDelivered {
		return errors.New("cannot change status of a delivered order")
	}

	newStatus := entities.OrderStatus(strings.ToLower(status))
	
	// Realistic Transitions: can only move forward
	// Flow: Pending -> Confirmed -> Shipped -> Delivered
	if newStatus != entities.OrderCancelled {
		orderRank := map[entities.OrderStatus]int{
			entities.OrderPending:   1,
			entities.OrderConfirmed: 2,
			entities.OrderShipped:   3,
			entities.OrderDelivered: 4,
		}
		// Normalize current status for rank check
		currentStatus := entities.OrderStatus(strings.ToLower(string(order.Status)))
		if orderRank[newStatus] < orderRank[currentStatus] {
			return errors.New("cannot move order status backward")
		}
	}

	// If marked as cancelled manually
	if newStatus == entities.OrderCancelled {
		// 1. Mark all items as cancelled and restore stock
		items, _ := i.orderRepo.FindItemsByOrderID(id)
		for _, it := range items {
			if it.Status != entities.OrderItemCancelled {
				it.Status = entities.OrderItemCancelled
				i.orderRepo.UpdateItem(it)
				product, _ := i.productRepo.FindByID(it.ProductID)
				if product != nil {
					product.UpdateStockBySize(it.Size, it.Quantity)
					i.productRepo.Update(product)
				}
			}
		}

		// 2. Finalize Payment Status: Refunded if paid, Failed if pending
		payment, _ := i.paymentRepo.FindByOrderID(id)
		if payment != nil {
			if payment.PaymentStatus == entities.PaymentSuccess || payment.PaymentStatus == entities.PaymentRefunded {
				i.orderRepo.UpdatePaymentStatus(id, "Refunded")
				payment.PaymentStatus = entities.PaymentRefunded
				i.paymentRepo.Update(payment)
			} else if payment.PaymentStatus == entities.PaymentPending {
				i.orderRepo.UpdatePaymentStatus(id, "Failed")
				payment.PaymentStatus = entities.PaymentFailed
				i.paymentRepo.Update(payment)
			}
		}
	}

	// If marked as delivered and it's COD, update payment status to Paid
	pm := strings.ToLower(order.PaymentMethod)
	if newStatus == entities.OrderDelivered && (pm == "cod" || pm == "cash on delivery") {
		if strings.ToLower(order.PaymentStatus) != "paid" {
			i.orderRepo.UpdatePaymentStatus(id, "Paid")
			payment, _ := i.paymentRepo.FindByOrderID(id)
			if payment != nil {
				payment.PaymentStatus = entities.PaymentSuccess
				i.paymentRepo.Update(payment)
			}
		}
	}

	return i.orderRepo.UpdateStatus(id, newStatus)
}

func (i *Interactor) UpdateOrderPaymentStatus(id int64, status string) error {
	order, err := i.orderRepo.FindByID(id)
	if err != nil || order == nil {
		return errors.New("order not found")
	}

	// Status locking
	if order.Status == entities.OrderDelivered && strings.ToLower(status) != "paid" {
		return errors.New("cannot change payment status of a delivered order to anything but 'Paid'")
	}

	status = strings.Title(strings.ToLower(status)) // Normalize to 'Pending' or 'Paid'
	if status != "Pending" && status != "Paid" && status != "Failed" && status != "Refunded" {
		return errors.New("invalid payment status")
	}

	return i.orderRepo.UpdatePaymentStatus(id, status)
}

