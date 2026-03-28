const API_BASE = "http://localhost:3000/api";

export const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "") || "http://localhost:3000";

export const profilePhotoUrl = (path) => {
  if (!path || path === "" || path === "null") return null;
  if (path.startsWith("http")) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? path : "/" + path}`;
};

const getHeaders = () => {
  const token = localStorage.getItem("barca_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };
};

/* 
  Generic fetch wrapper with automatic token refresh logic
*/
let refreshTokenPromise = null;

const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem("barca_token");
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };

  let res = await fetch(url, { ...options, headers });

  // If 401 Unauthorized, try to refresh the token
  if (res.status === 401) {
    const refreshToken = localStorage.getItem("barca_refresh_token");
    if (refreshToken) {
      try {
        if (!refreshTokenPromise) {
          refreshTokenPromise = fetch(`${API_BASE}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refreshToken }),
          }).then(async (refreshRes) => {
            if (refreshRes.ok) {
              const { token: newToken, refresh_token: newRefreshToken } = await refreshRes.json();
              localStorage.setItem("barca_token", newToken);
              localStorage.setItem("barca_refresh_token", newRefreshToken);
              return newToken;
            } else {
              throw new Error("Session expired");
            }
          }).finally(() => {
            refreshTokenPromise = null; // Reset promise so future 401s can trigger refresh again
          });
        }

        const newToken = await refreshTokenPromise;

        // Retry the original request with the new token
        headers["Authorization"] = `Bearer ${newToken}`;
        res = await fetch(url, { ...options, headers });
      } catch (err) {
        handleAuthFailure();
      }
    } else {
      handleAuthFailure();
    }
  }

  return res;
};

const handleAuthFailure = () => {
  localStorage.removeItem("barca_token");
  localStorage.removeItem("barca_refresh_token");
  sessionStorage.removeItem("barca_session");

  // Display appropriate message and redirect when auto-logged out
  alert("Your session has expired or your account has been blocked. Please log in again.");
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

// -------------------- AUTH --------------------

export const logoutAPI = async () => {
  try {
    const token = localStorage.getItem("barca_token");
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      },
    });
  } catch (e) {
    // Ignore errors — we clear local state regardless
  }
};

export const login = async ({ email, password }) => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");

  if (data.token) {
    localStorage.setItem("barca_token", data.token);
    localStorage.setItem("barca_refresh_token", data.refresh_token);
  }

  return data.user;
};

export const register = async ({ name, email, password }) => {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Registration failed");

  return data;
};

export const verifyOTP = async ({ email, otp }) => {
  const res = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code: otp }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Verification failed");

  return data;
};

export const forgotPassword = async (email) => {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
};

export const resetPassword = async (data) => {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const resData = await res.json();
  if (!res.ok) throw new Error(resData.error || "Reset failed");
  return resData;
};

// -------------------- USERS / PROFILE --------------------

export const getProfile = async () => {
  const res = await fetchWithAuth(`${API_BASE}/user/profile`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch profile");
  return data;
};

export const updateProfile = async (userData) => {
  const res = await fetchWithAuth(`${API_BASE}/user/profile`, {
    method: "PUT",
    body: JSON.stringify(userData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Update failed");
  return data;
};

export const uploadProfilePhoto = async (file) => {
  const formData = new FormData();
  formData.append("photo", file);

  const token = localStorage.getItem("barca_token");
  const res = await fetch(`${API_BASE}/user/profile-photo`, {
    method: "POST",
    headers: {
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data;
};

export const removeProfilePhoto = async () => {
  const res = await fetchWithAuth(`${API_BASE}/user/profile-photo`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Removal failed");
  return data;
};

// -------------------- ADDRESSES --------------------

export const getAddresses = async () => {
  const res = await fetchWithAuth(`${API_BASE}/user/addresses`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch addresses");
  return data;
};

export const addAddress = async (address) => {
  const res = await fetchWithAuth(`${API_BASE}/user/addresses`, {
    method: "POST",
    body: JSON.stringify(address),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to add address");
  return data;
};

export const updateAddress = async (id, address) => {
  const res = await fetchWithAuth(`${API_BASE}/user/addresses/${id}`, {
    method: "PUT",
    body: JSON.stringify(address),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update address");
  return data;
};

export const deleteAddress = async (id) => {
  const res = await fetchWithAuth(`${API_BASE}/user/addresses/${id}`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to delete address");
  return data;
};

// -------------------- PRODUCTS --------------------

export const getProductsByCategory = async (category) => {
  const res = await fetch(`${API_BASE}/products/category?category=${encodeURIComponent(category)}`);
  return await res.json();
};

export const getProducts = async () => {
  const res = await fetch(`${API_BASE}/products`);
  return await res.json();
};

export const getProduct = async (id) => {
  const res = await fetch(`${API_BASE}/products/${id}`);
  return await res.json();
};

export const searchProducts = async (q) => {
  const res = await fetch(`${API_BASE}/products/search?q=${q}`);
  return await res.json();
};

export const addProduct = async (product) => {
  const res = await fetchWithAuth(`${API_BASE}/admin/products`, {
    method: "POST",
    body: JSON.stringify(product),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to add product");
  return data;
};

export const updateProduct = async (id, product) => {
  const res = await fetchWithAuth(`${API_BASE}/admin/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(product),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update product");
  return data;
};

export const deleteProduct = async (id) => {
  const res = await fetchWithAuth(`${API_BASE}/admin/products/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to delete product");
  }
};

// -------------------- CART --------------------

export const getCartSummary = async () => {
  const res = await fetchWithAuth(`${API_BASE}/cart/summary`);
  return await res.json();
};

export const getCart = async () => {
  const res = await fetchWithAuth(`${API_BASE}/cart`);
  return await res.json();
};

export const addToCart = async (item) => {
  const res = await fetchWithAuth(`${API_BASE}/cart`, {
    method: "POST",
    body: JSON.stringify(item),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to add to cart");
  return data;
};

export const updateCartItem = async (id, data) => {
  const res = await fetchWithAuth(`${API_BASE}/cart/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  const resData = await res.json();
  if (!res.ok) throw new Error(resData.error || "Failed to update item");
  return resData;
};

export const deleteCartItem = async (id) => {
  const res = await fetchWithAuth(`${API_BASE}/cart/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to delete item");
  }
};

export const clearCart = async () => {
  const res = await fetchWithAuth(`${API_BASE}/cart/clear`, {
    method: "POST",
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to clear cart");
  }
};

// -------------------- WISHLIST --------------------

export const getWishlist = async () => {
  const res = await fetchWithAuth(`${API_BASE}/wishlist`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch wishlist");
  return data;
};

export const addToWishlist = async (productId) => {
  const res = await fetchWithAuth(`${API_BASE}/wishlist`, {
    method: "POST",
    body: JSON.stringify({ product_id: productId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to add to wishlist");
  return data;
};

export const removeFromWishlist = async (productId) => {
  const res = await fetchWithAuth(`${API_BASE}/wishlist/${productId}`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to remove from wishlist");
  return data;
};

export const checkWishlist = async (productId) => {
  const res = await fetchWithAuth(`${API_BASE}/wishlist/${productId}/check`);
  return await res.json();
};

// -------------------- ORDERS --------------------

export const checkoutFromCart = async (checkoutData) => {
  const res = await fetchWithAuth(`${API_BASE}/orders/checkout`, {
    method: "POST",
    body: JSON.stringify(checkoutData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Checkout failed");
  return data;
};

export const cancelOrderItem = async (itemId) => {
  const res = await fetchWithAuth(`${API_BASE}/orders/items/${itemId}/cancel`, {
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to cancel order item");
  return data;
};

export const returnOrderItem = async (itemId, returnData) => {
  const res = await fetchWithAuth(`${API_BASE}/orders/items/${itemId}/return`, {
    method: "POST",
    body: JSON.stringify(returnData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to return order item");
  return data;
};

export const createOrder = async (order) => {
  const res = await fetchWithAuth(`${API_BASE}/orders`, {
    method: "POST",
    body: JSON.stringify(order),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Order creation failed");
  return data;
};

export const getOrdersByUser = async () => {
  const res = await fetchWithAuth(`${API_BASE}/orders`);
  return await res.json();
};

export const cancelOrder = async (orderId) => {
  const res = await fetchWithAuth(`${API_BASE}/orders/${orderId}/cancel`, {
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to cancel order");
  return data;
};

export const downloadInvoice = async (orderId) => {
  const res = await fetchWithAuth(`${API_BASE}/orders/${orderId}/invoice`);
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to download invoice");
  }
  return await res.arrayBuffer();
};

export const createPayment = async (data) => {
  const res = await fetchWithAuth(`${API_BASE}/payments/create`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  const resData = await res.json();
  if (!res.ok) throw new Error(resData.error || "Payment creation failed");
  return resData;
};

// -------------------- STATUS --------------------

export const getApiStatus = async () => {
  const res = await fetchWithAuth(`${API_BASE}/status`);
  return await res.json();
};

// -------------------- ADMIN --------------------

export const updateStock = async (productId, size, quantity) => {
  const res = await fetchWithAuth(`${API_BASE}/admin/products/${productId}/stock`, {
    method: "PUT",
    body: JSON.stringify({ size, quantity }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update stock");
  return data;
};

export const getUsers = async () => {
  const res = await fetchWithAuth(`${API_BASE}/admin/users`);
  return await res.json();
};

export const blockUser = async (id) => {
  await fetchWithAuth(`${API_BASE}/admin/users/${id}/block`, {
    method: "PUT",
  });
};

export const unblockUser = async (id) => {
  await fetchWithAuth(`${API_BASE}/admin/users/${id}/unblock`, {
    method: "PUT",
  });
};

export const updateUser = async (id, data) => {
  if (data.status) {
    if (data.status === "Suspended") {
      await blockUser(id);
    } else {
      await unblockUser(id);
    }
  }
  if (data.role) {
    const res = await fetchWithAuth(`${API_BASE}/admin/users/${id}/role`, {
      method: "PUT",
      body: JSON.stringify({ role: data.role }),
    });
    return await res.json();
  }
};

export const deleteUser = async (id) => {
  // Map delete to block for safety since no DELETE /admin/users exists
  return await blockUser(id);
};

export const getOrders = async () => {
  const res = await fetchWithAuth(`${API_BASE}/admin/orders?limit=1000`);
  return await res.json();
};

export const updateOrder = async (id, data) => {
  const res = await fetchWithAuth(`${API_BASE}/admin/orders/${id}/status`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return await res.json();
};

export const updateOrderPaymentStatus = async (id, paymentStatus) => {
  const res = await fetchWithAuth(`${API_BASE}/admin/orders/${id}/payment-status`, {
    method: "PUT",
    body: JSON.stringify({ payment_status: paymentStatus }),
  });
  return await res.json();
};

export const refundOrder = async (id) => {
  const res = await fetchWithAuth(`${API_BASE}/admin/orders/${id}/refund`, {
    method: "POST"
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to process refund");
  return data;
};

export const refundOrderItem = async (itemId) => {
  const res = await fetchWithAuth(`${API_BASE}/admin/orders/items/${itemId}/refund`, {
    method: "POST"
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to process item refund");
  return data;
};

export const approveReturnOrderItem = async (itemId, commentData) => {
  const res = await fetchWithAuth(`${API_BASE}/admin/orders/items/${itemId}/return/approve`, {
    method: "POST",
    body: JSON.stringify(commentData || {})
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to approve return request");
  return data;
};

export const rejectReturnOrderItem = async (itemId, commentData) => {
  const res = await fetchWithAuth(`${API_BASE}/admin/orders/items/${itemId}/return/reject`, {
    method: "POST",
    body: JSON.stringify(commentData || {})
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to reject return request");
  return data;
};

export const getDashboardMetrics = async () => {
  const res = await fetchWithAuth(`${API_BASE}/admin/dashboard/metrics`);
  return await res.json();
};

export const applyCoupon = async (code, subtotal) => {
  const res = await fetch(`${API_BASE}/coupons/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, subtotal }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to apply coupon");
  return data;
};

export const getCoupons = async () => {
  const res = await fetchWithAuth(`${API_BASE}/admin/coupons`);
  return await res.json();
};

export const getPublicCoupons = async () => {
  const res = await fetch(`${API_BASE}/coupons`);
  return await res.json();
};

export const createCoupon = async (coupon) => {
  const res = await fetchWithAuth(`${API_BASE}/admin/coupons`, {
    method: "POST",
    body: JSON.stringify(coupon),
  });
  return await res.json();
};

export const updateCoupon = async (id, coupon) => {
  const res = await fetchWithAuth(`${API_BASE}/admin/coupons/${id}`, {
    method: "PUT",
    body: JSON.stringify(coupon),
  });
  return await res.json();
};

export const deleteCoupon = async (id) => {
  await fetchWithAuth(`${API_BASE}/admin/coupons/${id}`, {
    method: "DELETE",
  });
};

// -------------------- REVIEWS --------------------

export const rateProduct = async (productId, value) => {
  const res = await fetchWithAuth(`${API_BASE}/reviews/${productId}/rate`, {
    method: "POST",
    body: JSON.stringify({ value }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to submit rating");
  return data;
};

export const getProductReviews = async (productId) => {
  const res = await fetch(`${API_BASE}/reviews/${productId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch reviews");
  return data;
};

export const getMyReview = async (productId) => {
  const res = await fetchWithAuth(`${API_BASE}/reviews/${productId}/my`);
  const data = await res.json();
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(data.error || "Failed to fetch your review");
  return data;
};

export const addReview = async (productId, reviewData) => {
  const res = await fetchWithAuth(`${API_BASE}/reviews/${productId}`, {
    method: "POST",
    body: JSON.stringify(reviewData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to add review");
  return data;
};

export const updateReview = async (reviewId, reviewData) => {
  const res = await fetchWithAuth(`${API_BASE}/reviews/${reviewId}`, {
    method: "PUT",
    body: JSON.stringify(reviewData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update review");
  return data;
};

export const deleteReview = async (reviewId) => {
  const res = await fetchWithAuth(`${API_BASE}/reviews/${reviewId}`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to delete review");
  return data;
};
