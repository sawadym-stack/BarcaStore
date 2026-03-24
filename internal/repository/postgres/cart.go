package postgres

import (
	"github.com/sawadym-stack/barca-store-clean/internal/domain/entities"
	"gorm.io/gorm"
)

type CartRepository struct {
	db *gorm.DB
}

func NewCartRepo(db *gorm.DB) *CartRepository {
	return &CartRepository{db: db}
}

func (r *CartRepository) CreateCart(userID int64) (*entities.Cart, error) {
	cart := &entities.Cart{UserID: userID}
	if err := r.db.Create(cart).Error; err != nil {
		return nil, err
	}
	return cart, nil
}

func (r *CartRepository) GetCartByUserID(userID int64) (*entities.Cart, error) {
	var cart entities.Cart
	if err := r.db.Where("user_id = ?", userID).First(&cart).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &cart, nil
}

func (r *CartRepository) DeleteCart(cartID int64) error {
	return r.db.Delete(&entities.Cart{}, cartID).Error
}

// ============= CartItem Repository =============

type CartItemRepository struct {
	db *gorm.DB
}

func NewCartItemRepo(db *gorm.DB) *CartItemRepository {
	return &CartItemRepository{db: db}
}

func (r *CartItemRepository) AddItem(item *entities.CartItem) error {
	// Check if item already in cart with same size
	var existing entities.CartItem
	if err := r.db.Where("cart_id = ? AND product_id = ? AND size = ?", item.CartID, item.ProductID, item.Size).First(&existing).Error; err == nil {
		// Item exists, update quantity
		return r.db.Model(&existing).Update("quantity", gorm.Expr("quantity + ?", item.Quantity)).Error
	}
	// Item doesn't exist, create new
	return r.db.Create(item).Error
}

func (r *CartItemRepository) GetCartItems(cartID int64) ([]*entities.CartItem, error) {
	var items []*entities.CartItem
	if err := r.db.Where("cart_id = ?", cartID).Order("id ASC").Find(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}

func (r *CartItemRepository) GetItemByID(id int64) (*entities.CartItem, error) {
	var item entities.CartItem
	if err := r.db.First(&item, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &item, nil
}

func (r *CartItemRepository) UpdateQuantity(id int64, quantity int) error {
	if quantity <= 0 {
		return r.RemoveItem(id)
	}
	return r.db.Model(&entities.CartItem{}).Where("id = ?", id).Update("quantity", quantity).Error
}

func (r *CartItemRepository) UpdateSize(id int64, size string) error {
	return r.db.Model(&entities.CartItem{}).Where("id = ?", id).Update("size", size).Error
}

func (r *CartItemRepository) GetItemByCartProductAndSize(cartID, productID int64, size string) (*entities.CartItem, error) {
	var item entities.CartItem
	if err := r.db.Where("cart_id = ? AND product_id = ? AND size = ?", cartID, productID, size).First(&item).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &item, nil
}

func (r *CartItemRepository) RemoveItem(id int64) error {
	return r.db.Delete(&entities.CartItem{}, id).Error
}

func (r *CartItemRepository) ClearCart(cartID int64) error {
	return r.db.Where("cart_id = ?", cartID).Delete(&entities.CartItem{}).Error
}

// ============= Wishlist Repository =============

type WishlistRepository struct {
	db *gorm.DB
}

func NewWishlistRepo(db *gorm.DB) *WishlistRepository {
	return &WishlistRepository{db: db}
}

func (r *WishlistRepository) AddToWishlist(wishlist *entities.Wishlist) error {
	return r.db.Create(wishlist).Error
}

func (r *WishlistRepository) GetWishlist(userID int64) ([]*entities.Wishlist, error) {
	var wishlists []*entities.Wishlist
	if err := r.db.Where("user_id = ?", userID).Order("id ASC").Find(&wishlists).Error; err != nil {
		return nil, err
	}
	return wishlists, nil
}

func (r *WishlistRepository) RemoveFromWishlist(userID, productID int64) error {
	return r.db.Where("user_id = ? AND product_id = ?", userID, productID).Delete(&entities.Wishlist{}).Error
}

func (r *WishlistRepository) IsInWishlist(userID, productID int64) (bool, error) {
	var count int64
	if err := r.db.Model(&entities.Wishlist{}).Where("user_id = ? AND product_id = ?", userID, productID).Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}
