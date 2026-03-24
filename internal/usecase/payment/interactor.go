package payment

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/sawadym-stack/barca-store-clean/internal/domain/entities"
	"github.com/sawadym-stack/barca-store-clean/internal/domain/ports"
)

type Interactor struct {
	paymentRepo ports.PaymentRepository
	orderRepo   ports.OrderRepository
	invoiceRepo ports.InvoiceRepository
	refundRepo  ports.RefundRepository
	userRepo    ports.UserRepository
	productRepo ports.ProductRepository
}

func NewInteractor(
	paymentRepo ports.PaymentRepository,
	orderRepo ports.OrderRepository,
	invoiceRepo ports.InvoiceRepository,
	refundRepo ports.RefundRepository,
	userRepo ports.UserRepository,
	productRepo ports.ProductRepository,
) *Interactor {
	return &Interactor{
		paymentRepo: paymentRepo,
		orderRepo:   orderRepo,
		invoiceRepo: invoiceRepo,
		refundRepo:  refundRepo,
		userRepo:    userRepo,
		productRepo: productRepo,
	}
}

func (i *Interactor) CreatePaymentOrder(orderID int64, mockStatus string) (*entities.Payment, error) {
	order, err := i.orderRepo.FindByID(orderID)
	if err != nil {
		return nil, err
	}
	if order == nil {
		return nil, errors.New("order not found")
	}

	amountInPaise := int64(order.TotalAmount * 100)
	transactionID := fmt.Sprintf("mock_pay_%d_%d", time.Now().UnixNano(), order.ID)

	payment := &entities.Payment{
		OrderID:       order.ID,
		UserID:        order.UserID,
		TransactionID: transactionID,
		PaymentMethod: order.PaymentMethod,
		Amount:        amountInPaise,
		Currency:      "INR", // Assuming standard for mock
		PaymentStatus: entities.PaymentPending,
	}

	if err := i.paymentRepo.Create(payment); err != nil {
		return nil, err
	}

	if order.PaymentMethod == "MOCK_ONLINE" {
		now := time.Now()

		if mockStatus == "failed" {
			payment.PaymentStatus = entities.PaymentFailed
			payment.PaidAt = &now
			if err := i.paymentRepo.Update(payment); err != nil {
				return nil, err
			}

			// Keep order as pending, payment failed
			order.PaymentStatus = "Failed"
			if err := i.orderRepo.Update(order); err != nil {
				return nil, err
			}
			return payment, nil
		}

		payment.PaymentStatus = entities.PaymentSuccess
		payment.PaidAt = &now
		if err := i.paymentRepo.Update(payment); err != nil {
			return nil, err
		}

		order.Status = entities.OrderConfirmed
		order.PaymentStatus = "Paid"
		if err := i.orderRepo.Update(order); err != nil {
			return nil, err
		}

		if err := i.GenerateInvoice(order); err != nil {
			return nil, err
		}
	} else if order.PaymentMethod == "COD" {
		order.Status = entities.OrderConfirmed
		order.PaymentStatus = "Pending"
		if err := i.orderRepo.Update(order); err != nil {
			return nil, err
		}
	}

	return payment, nil
}

func (i *Interactor) GenerateInvoice(order *entities.Order) error {
	user, err := i.userRepo.FindByID(order.UserID)
	if err != nil {
		return err
	}

	paymentStatus := entities.InvoicePaid
	if order.PaymentStatus == "Pending" || order.PaymentMethod == "COD" {
		paymentStatus = entities.InvoicePending
	}

	invoice := &entities.Invoice{
		OrderID:            order.ID,
		UserID:             order.UserID,
		UserName:           user.Name,
		UserEmail:          user.Email,
		Subtotal:           order.Subtotal,
		Tax:                order.Tax,
		Discount:           0, // Assuming 0 for now
		FinalPayableAmount: order.TotalAmount,
		PaymentStatus:      paymentStatus,
		OrderStatus:        order.Status,
		CreatedAt:          time.Now(),
	}

	return i.invoiceRepo.Create(invoice)
}

func (i *Interactor) GetInvoiceByOrderID(orderID int64) (*entities.Invoice, error) {
	invoice, err := i.invoiceRepo.FindByOrderID(orderID)
	if err != nil {
		return nil, err
	}

	if invoice == nil {
		// Generate invoice if missing
		order, err := i.orderRepo.FindByID(orderID)
		if err != nil {
			return nil, err
		}
		if order == nil {
			return nil, nil
		}
		if err := i.GenerateInvoice(order); err != nil {
			return nil, err
		}
		return i.invoiceRepo.FindByOrderID(orderID)
	}

	return invoice, nil
}

func (i *Interactor) CancelOrderItem(orderItemID int64) error {
	item, err := i.orderRepo.FindItemByID(orderItemID)
	if err != nil {
		return err
	}
	if item == nil || item.Status == entities.OrderItemCancelled {
		return errors.New("item not found or already cancelled")
	}

	// 1. Update status
	item.Status = entities.OrderItemCancelled
	if err := i.orderRepo.UpdateItem(item); err != nil {
		return err
	}

	// 2. Restore stock
	product, err := i.productRepo.FindByID(item.ProductID)
	if err == nil && product != nil {
		product.UpdateStockBySize(item.Size, item.Quantity)
		i.productRepo.Update(product)
	}

	// 3. Handle Refund if paid
	payment, _ := i.paymentRepo.FindByOrderID(item.OrderID)
	if payment != nil && payment.PaymentStatus == entities.PaymentSuccess {
		refundAmount := int64(item.Price * float64(item.Quantity) * 100)
		i.ProcessRefund(payment.ID, &item.ID, refundAmount)
	}

	// 4. Check if all items are now cancelled/returned
	allItems, err := i.orderRepo.FindItemsByOrderID(item.OrderID)
	if err == nil {
		allCancelled := true
		for _, it := range allItems {
			if it.Status == entities.OrderItemActive {
				allCancelled = false
				break
			}
		}
		if allCancelled {
			i.orderRepo.UpdateStatus(item.OrderID, entities.OrderCancelled)
			// Finalize Payment Status: Refunded if paid, Failed if pending
			if payment != nil {
				if payment.PaymentStatus == entities.PaymentSuccess || payment.PaymentStatus == entities.PaymentRefunded {
					i.orderRepo.UpdatePaymentStatus(item.OrderID, "Refunded")
				} else if payment.PaymentStatus == entities.PaymentPending {
					i.orderRepo.UpdatePaymentStatus(item.OrderID, "Failed")
					payment.PaymentStatus = entities.PaymentFailed
					i.paymentRepo.Update(payment)
				}
			}
		}
	}

	return nil
}

func (i *Interactor) CancelOrder(orderID int64, userID int64) error {
	order, err := i.orderRepo.FindByID(orderID)
	if err != nil {
		return err
	}
	if order == nil {
		return errors.New("order not found")
	}
	if order.UserID != userID {
		return errors.New("you can only cancel your own orders")
	}
	if order.Status == entities.OrderCancelled {
		return errors.New("order already cancelled")
	}

	if order.Status == entities.OrderDelivered || order.Status == entities.OrderShipped {
		return errors.New("cannot cancel a shipped or delivered order")
	}

	// 1. Cancel all items
	items, err := i.orderRepo.FindItemsByOrderID(orderID)
	if err != nil {
		return err
	}
	for _, item := range items {
		if item.Status != entities.OrderItemCancelled {
			item.Status = entities.OrderItemCancelled
			i.orderRepo.UpdateItem(item)

			product, _ := i.productRepo.FindByID(item.ProductID)
			if product != nil {
				product.UpdateStockBySize(item.Size, item.Quantity)
				i.productRepo.Update(product)
			}
		}
	}

	// 2. Handle bulk Refund if paid online
	payment, _ := i.paymentRepo.FindByOrderID(orderID)
	if payment != nil {
		if payment.PaymentStatus == entities.PaymentSuccess {
			refundAmountInPaise := int64(order.TotalAmount * 100)
			if err := i.ProcessRefund(payment.ID, nil, refundAmountInPaise); err != nil {
				return err
			}
		} else if payment.PaymentStatus == entities.PaymentPending {
			payment.PaymentStatus = entities.PaymentFailed
			i.paymentRepo.Update(payment)
			i.orderRepo.UpdatePaymentStatus(orderID, "Failed")
		}
	}

	// 2. Update order status
	order.Status = entities.OrderCancelled
	return i.orderRepo.Update(order)
}

func (i *Interactor) ProcessRefund(paymentID int64, orderItemID *int64, amount int64) error {
	payment, err := i.paymentRepo.FindByID(paymentID)
	if err != nil || payment == nil {
		return errors.New("payment not found")
	}

	transactionID := fmt.Sprintf("mock_refund_%d_%d", time.Now().UnixNano(), payment.ID)

	refund := &entities.Refund{
		PaymentID:     paymentID,
		OrderItemID:   orderItemID,
		TransactionID: transactionID,
		RefundAmount:  amount,
		RefundStatus:  entities.RefundCompleted,
	}

	if err := i.refundRepo.Create(refund); err != nil {
		return err
	}

	// Update Order Item with RefundID if specific item
	if orderItemID != nil {
		item, _ := i.orderRepo.FindItemByID(*orderItemID)
		if item != nil {
			item.RefundID = &refund.ID
			i.orderRepo.UpdateItem(item)
		}
	}

	// Add to User Wallet
	user, err := i.userRepo.FindByID(payment.UserID)
	if err == nil && user != nil {
		user.WalletBalance += float64(amount) / 100.0
		i.userRepo.Update(user)
	}

	// Update Payment status
	if orderItemID == nil {
		payment.PaymentStatus = entities.PaymentRefunded
	} else {
		// Check if all items are now refunded
		allItems, err := i.orderRepo.FindItemsByOrderID(payment.OrderID)
		if err == nil {
			allRefunded := true
			for _, it := range allItems {
				if it.RefundID == nil {
					allRefunded = false
					break
				}
			}
			if allRefunded {
				payment.PaymentStatus = entities.PaymentRefunded
				// Also update the order payment status string
				i.orderRepo.UpdatePaymentStatus(payment.OrderID, "Refunded")
			} else {
				payment.PaymentStatus = entities.PaymentPartiallyRefunded
				i.orderRepo.UpdatePaymentStatus(payment.OrderID, "Partially_Refunded")
			}
		} else {
			payment.PaymentStatus = entities.PaymentPartiallyRefunded
		}
	}
	return i.paymentRepo.Update(payment)
}

func (i *Interactor) ProcessAdminRefund(orderID int64) error {
	order, err := i.orderRepo.FindByID(orderID)
	if err != nil || order == nil {
		return errors.New("order not found")
	}

	if order.Status != entities.OrderCancelled {
		return errors.New("cannot refund an order that is not cancelled")
	}

	// Check the ORDER's payment_status (this is what the admin dropdown updates)
	orderPS := strings.ToLower(order.PaymentStatus)
	if orderPS == "refunded" {
		return errors.New("this order has already been refunded")
	}
	if orderPS != "paid" && orderPS != "success" {
		return errors.New("only paid orders can be refunded")
	}

	refundAmount := int64(order.TotalAmount * 100)

	// Try to find a payment record and use ProcessRefund if it exists
	payment, _ := i.paymentRepo.FindByOrderID(orderID)
	if payment != nil {
		if err := i.ProcessRefund(payment.ID, nil, refundAmount); err != nil {
			return err
		}
	} else {
		// No payment record (COD) – credit the wallet directly
		user, err := i.userRepo.FindByID(order.UserID)
		if err == nil && user != nil {
			user.WalletBalance += float64(refundAmount) / 100.0
			i.userRepo.Update(user)
		}
	}

	// Update the order's payment_status to "Refunded"
	return i.orderRepo.UpdatePaymentStatus(order.ID, "Refunded")
}

func (i *Interactor) ReturnOrderItem(orderItemID int64, userID int64, reason string, comment string) error {
	item, err := i.orderRepo.FindItemByID(orderItemID)
	if err != nil {
		return err
	}
	if item == nil {
		return errors.New("item not found")
	}

	order, err := i.orderRepo.FindByID(item.OrderID)
	if err != nil || order == nil {
		return errors.New("order not found")
	}

	if order.UserID != userID {
		return errors.New("you can only return your own items")
	}

	if order.Status != entities.OrderDelivered {
		return errors.New("returns are only allowed for delivered orders")
	}

	if item.Status != entities.OrderItemActive {
		return errors.New("item is not active for return")
	}

	// Check 7-day return window
	if time.Since(order.CreatedAt) > 7*24*time.Hour {
		return errors.New("return window has expired (7 days)")
	}

	// Mark item as return requested
	item.Status = entities.OrderItemReturnRequested
	item.ReturnReason = &reason
	if comment != "" {
		item.ReturnAdminComment = &comment
	}

	return i.orderRepo.UpdateItem(item)
}

func (i *Interactor) ApproveReturnItem(orderItemID int64, adminComment string) error {
	item, err := i.orderRepo.FindItemByID(orderItemID)
	if err != nil || item == nil {
		return errors.New("item not found")
	}

	if item.Status != entities.OrderItemReturnRequested {
		return errors.New("item is not in return requested state")
	}

	order, err := i.orderRepo.FindByID(item.OrderID)
	if err != nil || order == nil {
		return errors.New("order not found")
	}

	// 1. Mark item as returned
	item.Status = entities.OrderItemReturned
	if adminComment != "" {
		item.ReturnAdminComment = &adminComment
	}
	if err := i.orderRepo.UpdateItem(item); err != nil {
		return err
	}

	// 2. Restore stock
	product, err := i.productRepo.FindByID(item.ProductID)
	if err == nil && product != nil {
		product.UpdateStockBySize(item.Size, item.Quantity)
		i.productRepo.Update(product)
	}

	// 3. Process refund if paid
	payment, _ := i.paymentRepo.FindByOrderID(item.OrderID)
	if payment != nil && payment.PaymentStatus == entities.PaymentSuccess {
		refundAmount := int64(item.Price * float64(item.Quantity) * 100)
		return i.ProcessRefund(payment.ID, &item.ID, refundAmount)
	}

	// For COD: credit wallet directly if paid
	orderPS := strings.ToLower(order.PaymentStatus)
	if orderPS == "paid" {
		user, err := i.userRepo.FindByID(order.UserID)
		if err == nil && user != nil {
			refundAmount := item.Price * float64(item.Quantity)
			user.WalletBalance += refundAmount
			i.userRepo.Update(user)
		}
	}

	return nil
}

func (i *Interactor) RejectReturnItem(orderItemID int64, adminComment string) error {
	item, err := i.orderRepo.FindItemByID(orderItemID)
	if err != nil || item == nil {
		return errors.New("item not found")
	}

	if item.Status != entities.OrderItemReturnRequested {
		return errors.New("item is not in return requested state")
	}

	item.Status = entities.OrderItemReturnRejected
	if adminComment != "" {
		item.ReturnAdminComment = &adminComment
	}

	return i.orderRepo.UpdateItem(item)
}

func (i *Interactor) GetOrderItemByID(id int64) (*entities.OrderItem, error) {
	return i.orderRepo.FindItemByID(id)
}

func (i *Interactor) GetPaymentByOrderID(orderID int64) (*entities.Payment, error) {
	return i.paymentRepo.FindByOrderID(orderID)
}
