package ports

import "github.com/sawadym-stack/barca-store-clean/internal/domain/entities"

type CartRepository interface {
	CreateCart(userID int64) (*entities.Cart, error)
	GetCartByUserID(userID int64) (*entities.Cart, error)
	DeleteCart(cartID int64) error
}

type CartItemRepository interface {
	AddItem(item *entities.CartItem) error
	GetCartItems(cartID int64) ([]*entities.CartItem, error)
	GetItemByID(id int64) (*entities.CartItem, error)
	UpdateQuantity(id int64, quantity int) error
	UpdateSize(id int64, size string) error
	GetItemByCartProductAndSize(cartID, productID int64, size string) (*entities.CartItem, error)
	RemoveItem(id int64) error
	ClearCart(cartID int64) error
}

type WishlistRepository interface {
	AddToWishlist(wishlist *entities.Wishlist) error
	GetWishlist(userID int64) ([]*entities.Wishlist, error)
	RemoveFromWishlist(userID, productID int64) error
	IsInWishlist(userID, productID int64) (bool, error)
}
