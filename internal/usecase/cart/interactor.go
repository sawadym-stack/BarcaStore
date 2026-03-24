package cart

import (
	"errors"

	"github.com/sawadym-stack/barca-store-clean/internal/domain/entities"
	"github.com/sawadym-stack/barca-store-clean/internal/domain/ports"
)

type Interactor struct {
	cartRepo     ports.CartRepository
	cartItemRepo ports.CartItemRepository
	wishlistRepo ports.WishlistRepository
	productRepo  ports.ProductRepository
}

func NewInteractor(
	cartRepo ports.CartRepository,
	cartItemRepo ports.CartItemRepository,
	wishlistRepo ports.WishlistRepository,
	productRepo ports.ProductRepository,
) *Interactor {
	return &Interactor{
		cartRepo:     cartRepo,
		cartItemRepo: cartItemRepo,
		wishlistRepo: wishlistRepo,
		productRepo:  productRepo,
	}
}

type CartItemOutput struct {
	ID          int64
	CartID      int64
	ProductID   int64
	ProductName string
	Price       float64
	Category    string
	ImageURL    string
	Quantity    int
	Size        string
	CreatedAt   string
}

type CartOutput struct {
	ID    int64
	Items []CartItemOutput
	Total float64
}

type CartSummaryOutput struct {
	CartID     int64
	ItemCount  int
	TotalPrice float64
	TotalItems int
}

type WishlistItemOutput struct {
	ID          int64
	UserID      int64
	ProductID   int64
	ProductName string
	Price       float64
	Category    string
	ImageURL    string
	CreatedAt   string
}

type WishlistOutput struct {
	Items []WishlistItemOutput
}

// GetOrCreateCart gets user's cart or creates one if doesn't exist
func (i *Interactor) GetOrCreateCart(userID int64) (*CartOutput, error) {
	if userID <= 0 {
		return nil, errors.New("invalid user ID")
	}

	cart, err := i.cartRepo.GetCartByUserID(userID)
	if err != nil {
		return nil, err
	}

	if cart == nil {
		cart, err = i.cartRepo.CreateCart(userID)
		if err != nil {
			return nil, err
		}
	}

	items, err := i.cartItemRepo.GetCartItems(cart.ID)
	if err != nil {
		return nil, err
	}

	// Calculate total and adjust quantities based on stock
	total := 0.0
	var finalItemOutputs []CartItemOutput

	for _, item := range items {
		product, err := i.productRepo.FindByID(item.ProductID)
		if err != nil || product == nil {
			// Product not found or error, consider it unavailable and remove
			i.cartItemRepo.RemoveItem(item.ID)
			continue
		}

		stock := product.GetStockBySize(item.Size)
		if stock == 0 {
			// Out of stock, remove item
			i.cartItemRepo.RemoveItem(item.ID)
			continue
		}

		actualQuantity := item.Quantity
		if item.Quantity > stock {
			// Reduce quantity to available stock
			actualQuantity = stock
			i.cartItemRepo.UpdateQuantity(item.ID, actualQuantity)
		}

		total += product.Price * float64(actualQuantity)
		finalItemOutputs = append(finalItemOutputs, CartItemOutput{
			ID:          item.ID,
			CartID:      item.CartID,
			ProductID:   item.ProductID,
			ProductName: product.Name,
			Price:       product.Price,
			Category:    product.Category,
			ImageURL:    product.ImageURL,
			Quantity:    actualQuantity,
			Size:        item.Size,
			CreatedAt:   item.CreatedAt.String(),
		})
	}

	return &CartOutput{
		ID:    cart.ID,
		Items: finalItemOutputs,
		Total: total,
	}, nil
}

// AddToCart adds product to user's cart
func (i *Interactor) AddToCart(userID, productID int64, quantity int, size string) (*CartItemOutput, error) {
	if userID <= 0 {
		return nil, errors.New("invalid user ID")
	}
	if productID <= 0 {
		return nil, errors.New("invalid product ID")
	}
	if quantity <= 0 {
		return nil, errors.New("quantity must be greater than 0")
	}

	// Verify product exists and has stock
	product, err := i.productRepo.FindByID(productID)
	if err != nil {
		return nil, err
	}
	if product == nil {
		return nil, errors.New("product not found")
	}
	if product.GetStockBySize(size) < quantity {
		return nil, errors.New("insufficient stock")
	}

	// Get or create cart
	cart, err := i.cartRepo.GetCartByUserID(userID)
	if err != nil {
		return nil, err
	}
	if cart == nil {
		cart, err = i.cartRepo.CreateCart(userID)
		if err != nil {
			return nil, err
		}
	}

	// Add item to cart
	cartItem := &entities.CartItem{
		CartID:    cart.ID,
		ProductID: productID,
		Quantity:  quantity,
		Size:      size,
	}

	if err := i.cartItemRepo.AddItem(cartItem); err != nil {
		return nil, err
	}

	return &CartItemOutput{
		ID:          cartItem.ID,
		CartID:      cartItem.CartID,
		ProductID:   cartItem.ProductID,
		ProductName: product.Name,
		Price:       product.Price,
		Category:    product.Category,
		ImageURL:    product.ImageURL,
		Quantity:    cartItem.Quantity,
		Size:        cartItem.Size,
		CreatedAt:   cartItem.CreatedAt.String(),
	}, nil
}

// UpdateCartItem updates quantity of cart item
func (i *Interactor) UpdateCartItem(userID, itemID int64, quantity int, size string) (*CartItemOutput, error) {
	if userID <= 0 {
		return nil, errors.New("invalid user ID")
	}
	if itemID <= 0 {
		return nil, errors.New("invalid item ID")
	}
	if quantity < 0 {
		return nil, errors.New("quantity cannot be negative")
	}

	// Get item and verify ownership
	item, err := i.cartItemRepo.GetItemByID(itemID)
	if err != nil {
		return nil, err
	}
	if item == nil {
		return nil, errors.New("cart item not found")
	}

	cart, err := i.cartRepo.GetCartByUserID(userID)
	if err != nil {
		return nil, err
	}
	if cart == nil || cart.ID != item.CartID {
		return nil, errors.New("unauthorized")
	}

	// If quantity is 0, remove item
	if quantity == 0 {
		if err := i.cartItemRepo.RemoveItem(itemID); err != nil {
			return nil, err
		}
		return nil, nil
	}

	product, err := i.productRepo.FindByID(item.ProductID)
	if err != nil {
		return nil, err
	}
	if product == nil {
		return nil, errors.New("product not found")
	}

	// Handle Size Change
	finalSize := item.Size
	finalQuantity := quantity
	if size != "" && size != item.Size {
		// Check if another item with the new size already exists in the same cart
		existingWithNewSize, err := i.cartItemRepo.GetItemByCartProductAndSize(item.CartID, item.ProductID, size)
		if err != nil {
			return nil, err
		}

		if existingWithNewSize != nil && existingWithNewSize.ID != itemID {
			// MERGE: Another item with this size exists.
			finalQuantity = existingWithNewSize.Quantity + quantity
			finalSize = size

			// Check stock for total merged quantity
			if product.GetStockBySize(finalSize) < finalQuantity {
				return nil, errors.New("insufficient stock for merged quantity")
			}

			// Update the existing item and remove the current one
			if err := i.cartItemRepo.UpdateQuantity(existingWithNewSize.ID, finalQuantity); err != nil {
				return nil, err
			}
			if err := i.cartItemRepo.RemoveItem(itemID); err != nil {
				return nil, err
			}

			// Use the existing item's ID for the output
			item = existingWithNewSize
		} else {
			// NO MERGE: Just update the size of the current item
			finalSize = size
			if product.GetStockBySize(finalSize) < finalQuantity {
				return nil, errors.New("insufficient stock for new size")
			}
			if err := i.cartItemRepo.UpdateSize(itemID, finalSize); err != nil {
				return nil, err
			}
			item.Size = finalSize
		}
	} else {
		// Just quantity update
		if product.GetStockBySize(item.Size) < finalQuantity {
			return nil, errors.New("insufficient stock")
		}
	}

	// Finally update quantity
	if err := i.cartItemRepo.UpdateQuantity(item.ID, finalQuantity); err != nil {
		return nil, err
	}

	item.Quantity = finalQuantity
	return &CartItemOutput{
		ID:          item.ID,
		CartID:      item.CartID,
		ProductID:   item.ProductID,
		ProductName: product.Name,
		Price:       product.Price,
		Category:    product.Category,
		ImageURL:    product.ImageURL,
		Quantity:    item.Quantity,
		Size:        item.Size,
		CreatedAt:   item.CreatedAt.String(),
	}, nil
}

// RemoveFromCart removes item from cart
func (i *Interactor) RemoveFromCart(userID, itemID int64) error {
	if userID <= 0 {
		return errors.New("invalid user ID")
	}
	if itemID <= 0 {
		return errors.New("invalid item ID")
	}

	// Verify the item belongs to user's cart
	item, err := i.cartItemRepo.GetItemByID(itemID)
	if err != nil {
		return err
	}
	if item == nil {
		return errors.New("cart item not found")
	}

	// Verify cart belongs to user
	cart, err := i.cartRepo.GetCartByUserID(userID)
	if err != nil {
		return err
	}
	if cart == nil || cart.ID != item.CartID {
		return errors.New("unauthorized")
	}

	return i.cartItemRepo.RemoveItem(itemID)
}

// ClearCart empties user's cart
func (i *Interactor) ClearCart(userID int64) error {
	if userID <= 0 {
		return errors.New("invalid user ID")
	}

	cart, err := i.cartRepo.GetCartByUserID(userID)
	if err != nil {
		return err
	}
	if cart == nil {
		return errors.New("cart not found")
	}

	return i.cartItemRepo.ClearCart(cart.ID)
}

// GetCartSummary gets cart summary with totals
func (i *Interactor) GetCartSummary(userID int64) (*CartSummaryOutput, error) {
	if userID <= 0 {
		return nil, errors.New("invalid user ID")
	}

	cart, err := i.cartRepo.GetCartByUserID(userID)
	if err != nil {
		return nil, err
	}
	if cart == nil {
		return nil, errors.New("cart not found")
	}

	items, err := i.cartItemRepo.GetCartItems(cart.ID)
	if err != nil {
		return nil, err
	}

	totalPrice := 0.0
	totalItems := 0
	for _, item := range items {
		product, err := i.productRepo.FindByID(item.ProductID)
		if err != nil || product == nil {
			// Product not found or error, remove item completely
			i.cartItemRepo.RemoveItem(item.ID)
			continue
		}

		stock := product.GetStockBySize(item.Size)
		if stock == 0 {
			// Out of stock, remove item completely
			i.cartItemRepo.RemoveItem(item.ID)
			continue
		}

		actualQuantity := item.Quantity
		if item.Quantity > stock {
			// Reduce quantity to available stock
			actualQuantity = stock
			i.cartItemRepo.UpdateQuantity(item.ID, actualQuantity)
		}

		totalPrice += product.Price * float64(actualQuantity)
		totalItems += actualQuantity
	}

	return &CartSummaryOutput{
		CartID:     cart.ID,
		ItemCount:  len(items),
		TotalPrice: totalPrice,
		TotalItems: totalItems,
	}, nil
}

// Wishlist methods

// AddToWishlist adds product to user's wishlist
func (i *Interactor) AddToWishlist(userID, productID int64) (*WishlistItemOutput, error) {
	if userID <= 0 {
		return nil, errors.New("invalid user ID")
	}
	if productID <= 0 {
		return nil, errors.New("invalid product ID")
	}

	// Verify product exists
	product, err := i.productRepo.FindByID(productID)
	if err != nil {
		return nil, err
	}
	if product == nil {
		return nil, errors.New("product not found")
	}

	// Check if already in wishlist
	exists, err := i.wishlistRepo.IsInWishlist(userID, productID)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, errors.New("product already in wishlist")
	}

	wishlistItem := &entities.Wishlist{
		UserID:    userID,
		ProductID: productID,
	}

	if err := i.wishlistRepo.AddToWishlist(wishlistItem); err != nil {
		return nil, err
	}

	return &WishlistItemOutput{
		ID:          wishlistItem.ID,
		UserID:      wishlistItem.UserID,
		ProductID:   wishlistItem.ProductID,
		ProductName: product.Name,
		Price:       product.Price,
		Category:    product.Category,
		ImageURL:    product.ImageURL,
		CreatedAt:   wishlistItem.CreatedAt.String(),
	}, nil
}

// GetWishlist retrieves user's wishlist
func (i *Interactor) GetWishlist(userID int64) (*WishlistOutput, error) {
	if userID <= 0 {
		return nil, errors.New("invalid user ID")
	}

	wishlistItems, err := i.wishlistRepo.GetWishlist(userID)
	if err != nil {
		return nil, err
	}

	items := make([]WishlistItemOutput, len(wishlistItems))
	for idx, item := range wishlistItems {
		product, err := i.productRepo.FindByID(item.ProductID)
		if err != nil || product == nil {
			continue
		}

		items[idx] = WishlistItemOutput{
			ID:          item.ID,
			UserID:      item.UserID,
			ProductID:   item.ProductID,
			ProductName: product.Name,
			Price:       product.Price,
			Category:    product.Category,
			ImageURL:    product.ImageURL,
			CreatedAt:   item.CreatedAt.String(),
		}
	}

	return &WishlistOutput{
		Items: items,
	}, nil
}

// RemoveFromWishlist removes product from user's wishlist
func (i *Interactor) RemoveFromWishlist(userID, productID int64) error {
	if userID <= 0 {
		return errors.New("invalid user ID")
	}
	if productID <= 0 {
		return errors.New("invalid product ID")
	}

	// Verify it belongs to user
	exists, err := i.wishlistRepo.IsInWishlist(userID, productID)
	if err != nil {
		return err
	}
	if !exists {
		return errors.New("product not in wishlist")
	}

	return i.wishlistRepo.RemoveFromWishlist(userID, productID)
}

// IsInWishlist checks if product is in user's wishlist
func (i *Interactor) IsInWishlist(userID, productID int64) (bool, error) {
	if userID <= 0 {
		return false, errors.New("invalid user ID")
	}
	if productID <= 0 {
		return false, errors.New("invalid product ID")
	}

	return i.wishlistRepo.IsInWishlist(userID, productID)
}
