package payment

import (
	"bytes"
	"fmt"
	"strings"

	"github.com/jung-kurt/gofpdf"
)

func (i *Interactor) GeneratePDFInvoice(orderID int64) ([]byte, error) {
	// 1. Ensure invoice record exists
	invoice, err := i.GetInvoiceByOrderID(orderID)
	if err != nil {
		return nil, err
	}
	if invoice == nil {
		return nil, fmt.Errorf("could not generate invoice record for order %d", orderID)
	}

	// 2. Fetch full order
	order, err := i.orderRepo.FindByID(orderID)
	if err != nil {
		return nil, err
	}

	// 2.5 Only allow invoice download for paid orders
	if strings.ToLower(order.PaymentStatus) != "paid" {
		return nil, fmt.Errorf("invoice is only available after payment is completed")
	}

	// 3. Fetch items
	items, err := i.orderRepo.FindItemsByOrderID(orderID)
	if err != nil {
		return nil, err
	}

	// 4. Initialize PDF
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()
	pdf.SetFont("Arial", "B", 16)

	// Header
	pdf.CellFormat(190, 10, "INVOICE", "0", 1, "C", false, 0, "")
	pdf.Ln(10)

	// Order Details
	pdf.SetFont("Arial", "", 12)
	pdf.CellFormat(95, 8, fmt.Sprintf("Order ID: #%d", order.ID), "0", 0, "L", false, 0, "")
	pdf.CellFormat(95, 8, fmt.Sprintf("Date: %s", order.CreatedAt.Format("02 Jan 2006")), "0", 1, "R", false, 0, "")

	pdf.CellFormat(95, 8, fmt.Sprintf("Payment Method: %s", order.PaymentMethod), "0", 0, "L", false, 0, "")
	pdf.CellFormat(95, 8, fmt.Sprintf("Payment Status: %s", order.PaymentStatus), "0", 1, "R", false, 0, "")
	pdf.Ln(5)

	// Customer Details
	pdf.SetFont("Arial", "B", 12)
	pdf.CellFormat(190, 8, "Customer & Shipping Details:", "0", 1, "L", false, 0, "")
	pdf.SetFont("Arial", "", 11)
	pdf.CellFormat(190, 6, fmt.Sprintf("Name: %s", order.ShippingName), "0", 1, "L", false, 0, "")
	pdf.CellFormat(190, 6, fmt.Sprintf("Email: %s", order.ShippingEmail), "0", 1, "L", false, 0, "")
	pdf.CellFormat(190, 6, fmt.Sprintf("Phone: %s", order.ShippingPhone), "0", 1, "L", false, 0, "")
	pdf.MultiCell(190, 6, fmt.Sprintf("Address: %s, %s, %s - %s", order.ShippingAddress, order.ShippingCity, order.ShippingState, order.ShippingPincode), "0", "L", false)
	pdf.Ln(10)

	// Table Header
	pdf.SetFont("Arial", "B", 11)
	pdf.SetFillColor(200, 200, 200)
	pdf.CellFormat(90, 10, "Product", "1", 0, "C", true, 0, "")
	pdf.CellFormat(30, 10, "Price", "1", 0, "C", true, 0, "")
	pdf.CellFormat(30, 10, "Qty", "1", 0, "C", true, 0, "")
	pdf.CellFormat(40, 10, "Total", "1", 1, "C", true, 0, "")

	// Table Body
	pdf.SetFont("Arial", "", 11)
	for _, item := range items {
		product, _ := i.productRepo.FindByID(item.ProductID)
		name := "Unknown Product"
		if product != nil {
			name = product.Name
		}

		// Truncate name if too long
		if len(name) > 35 {
			name = name[:32] + "..."
		}

		total := item.Price * float64(item.Quantity)

		pdf.CellFormat(90, 10, name, "1", 0, "L", false, 0, "")
		pdf.CellFormat(30, 10, fmt.Sprintf("Rs %.2f", item.Price), "1", 0, "C", false, 0, "")
		pdf.CellFormat(30, 10, fmt.Sprintf("%d", item.Quantity), "1", 0, "C", false, 0, "")
		pdf.CellFormat(40, 10, fmt.Sprintf("Rs %.2f", total), "1", 1, "C", false, 0, "")
	}
	pdf.Ln(5)

	// Summary
	pdf.SetFont("Arial", "B", 11)
	pdf.CellFormat(150, 8, "Subtotal: ", "0", 0, "R", false, 0, "")
	pdf.CellFormat(40, 8, fmt.Sprintf("Rs %.2f", order.Subtotal), "0", 1, "C", false, 0, "")

	if order.Discount > 0 {
		pdf.CellFormat(150, 8, "Discount: ", "0", 0, "R", false, 0, "")
		pdf.CellFormat(40, 8, fmt.Sprintf("-Rs %.2f", order.Discount), "0", 1, "C", false, 0, "")
	}

	pdf.CellFormat(150, 8, "Shipping: ", "0", 0, "R", false, 0, "")
	if order.DeliveryCharge > 0 {
		pdf.CellFormat(40, 8, fmt.Sprintf("Rs %.2f", order.DeliveryCharge), "0", 1, "C", false, 0, "")
	} else {
		pdf.CellFormat(40, 8, "FREE", "0", 1, "C", false, 0, "")
	}

	pdf.CellFormat(150, 8, "Tax: ", "0", 0, "R", false, 0, "")
	pdf.CellFormat(40, 8, fmt.Sprintf("Rs %.2f", order.Tax), "0", 1, "C", false, 0, "")

	pdf.SetFont("Arial", "B", 14)
	pdf.CellFormat(150, 10, "Total Amount: ", "0", 0, "R", false, 0, "")
	pdf.CellFormat(40, 10, fmt.Sprintf("Rs %.2f", order.TotalAmount), "0", 1, "C", false, 0, "")

	var buf bytes.Buffer
	err = pdf.Output(&buf)
	if err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}
