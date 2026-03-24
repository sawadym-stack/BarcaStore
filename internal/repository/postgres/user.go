package postgres

import (
	"fmt"

	"github.com/sawadym-stack/barca-store-clean/internal/domain/entities"
	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepo(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(user *entities.User) error {
	return r.db.Create(user).Error
}

func (r *UserRepository) FindByEmail(email string) (*entities.User, error) {
	var user entities.User
	if err := r.db.Where("email = ?", email).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindByID(id int64) (*entities.User, error) {
	var user entities.User
	if err := r.db.First(&user, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) Update(user *entities.User) error {
	result := r.db.Model(user).Where("id = ?", user.ID).Updates(map[string]interface{}{
		"name":        user.Name,
		"email":       user.Email,
		"password":    user.Password,
		"is_blocked":  user.IsBlocked,
		"is_verified": user.IsVerified,
		"role":        user.Role,
	})

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("user with ID %d not found or no changes made", user.ID)
	}

	return nil
}

func (r *UserRepository) UpdateProfilePhoto(userID int64, photoPath string) error {
	result := r.db.Model(&entities.User{}).Where("id = ?", userID).Update("profile_photo", photoPath)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("user with ID %d not found", userID)
	}
	return nil
}

func (r *UserRepository) Delete(id int64) error {
	return r.db.Delete(&entities.User{}, id).Error
}

func (r *UserRepository) FindAll(limit, offset int) ([]*entities.User, error) {
	var users []*entities.User
	if err := r.db.Limit(limit).Offset(offset).Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

func (r *UserRepository) BlockUser(id int64) error {
	return r.db.Model(&entities.User{}).Where("id = ?", id).Update("is_blocked", true).Error
}

func (r *UserRepository) UnblockUser(id int64) error {
	return r.db.Model(&entities.User{}).Where("id = ?", id).Update("is_blocked", false).Error
}

func (r *UserRepository) UpdateRole(userID int64, newRole entities.UserRole) error {
	return r.db.Model(&entities.User{}).Where("id = ?", userID).Update("role", newRole).Error
}
