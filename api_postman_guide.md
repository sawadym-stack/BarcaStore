# Barca Store - API Postman Guide

Use this guide to test your backend endpoints.
**Base URL**: `http://localhost:8080/api`

---

## 1. Authentication (Public)

### Register
- **URL**: `/auth/register`
- **Method**: `POST`
- **Body**:
```json
{
  "email": "sawadympes@gmail.com",
  "name": "Sawad",
  "password": "password123"
}
```

### Verify OTP
- **URL**: `/auth/verify-otp`
- **Method**: `POST`
- **Body**:
```json
{
  "email": "sawadympes@gmail.com",
  "code": "123456"
}
```

### Login
- **URL**: `/auth/login`
- **Method**: `POST`
- **Body**:
```json
{
  "email": "sawadympes@gmail.com",
  "password": "password123"
}
```
*Note: Copy the `token` from the response to use in protected requests.*

### Forgot Password
- **URL**: `/auth/forgot-password`
- **Method**: `POST`
- **Body**:
```json
{
  "email": "sawadympes@gmail.com"
}
```

### Reset Password
- **URL**: `/auth/reset-password`
- **Method**: `POST`
- **Body**:
```json
{
  "token": "6-digit-otp",
  "password": "newpassword123"
}
```

---

## 2. User Profile (Protected)
*Requires Header: `Authorization: Bearer <token>`*

### Get Profile
- **URL**: `/user/profile`
- **Method**: `GET`

### Update Profile
- **URL**: `/user/profile`
- **Method**: `PUT`
- **Body**:
```json
{
  "name": "Sawad Modified",
  "email": "sawadympes@gmail.com"
}
```

### Upload Profile Photo
- **URL**: `/user/profile-photo`
- **Method**: `POST`
- **Body**: `form-data` (Key: `photo`, Value: `image file`)

---

## 3. Products (Public)

### List All Products
- **URL**: `/products`
- **Method**: `GET`
- **Params**: `limit=10`, `offset=0`

### Get Single Product
- **URL**: `/products/1`
- **Method**: `GET`

---

## 4. Cart (Protected)
*Requires Header: `Authorization: Bearer <token>`*

### Add to Cart
- **URL**: `/cart`
- **Method**: `POST`
- **Body**:
```json
{
  "product_id": 1,
  "quantity": 2,
  "size": "L"
}
```

### Update Quantity
- **URL**: `/cart/1`
- **Method**: `PUT`
- **Body**:
```json
{
  "quantity": 3
}
```

---

## 5. Orders (Protected)
*Requires Header: `Authorization: Bearer <token>`*

### Create Order
- **URL**: `/orders`
- **Method**: `POST`
- **Body**:
```json
{
  "subtotal": 2999,
  "tax": 539,
  "total": 3538,
  "payment": "Cash on Delivery",
  "shipping": {
    "name": "Sawad",
    "email": "sawadympes@gmail.com",
    "phone": "9876543210",
    "address": "123 Street",
    "city": "Kochi",
    "state": "Kerala",
    "pincode": "682001"
  },
  "items": [
    {
      "id": 1,
      "qty": 1,
      "price": 2999
    }
  ]
}
```

---

## 6. Admin Endpoints (Admin Only)
*Requires Admin JWT token*

### List Users
- **URL**: `/admin/users`
- **Method**: `GET`

### Update Order Status
- **URL**: `/admin/orders/1/status`
- **Method**: `PUT`
- **Body**:
```json
{
  "status": "Shipped"
}
```
