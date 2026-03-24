const STORAGE = {
  USERS: 'barca_users',
  PRODUCTS: 'barca_products',
  ORDERS: 'barca_orders'
}

// Initialize default data if not present
function ensure() {
  if (!localStorage.getItem(STORAGE.USERS)) {
    const users = [
      { id: '1', name: 'Admin', email: 'admin@barca.com', password: 'admin123', role: 'admin', cart: [], wishlist: [] },
      { id: '2', name: 'Demo User', email: 'user@barca.com', password: 'user123', role: 'user', cart: [], wishlist: [] }
    ]
    localStorage.setItem(STORAGE.USERS, JSON.stringify(users))
  }

  if (!localStorage.getItem(STORAGE.PRODUCTS)) {
    const products = [
      { id: '101', name: '2025 Home Jersey', price: 4999, img: 'https://m.media-amazon.com/images/I/61u5bSm5LCL._AC_UY1100_.jpg', description: 'Official 2025 home kit' },
      { id: '102', name: 'Training Jacket', price: 3499, img: 'https://m.media-amazon.com/images/I/61LQL7xN9pL._AC_UL1500_.jpg', description: 'Comfortable jacket' }
    ]
    localStorage.setItem(STORAGE.PRODUCTS, JSON.stringify(products))
  }

  if (!localStorage.getItem(STORAGE.ORDERS)) {
    localStorage.setItem(STORAGE.ORDERS, JSON.stringify([]))
  }
}

// Helper functions
const getData = (key) => JSON.parse(localStorage.getItem(key)) || []
const setData = (key, value) => localStorage.setItem(key, JSON.stringify(value))

// Authentication
export const login = async ({ email, password }) => {
  ensure()
  const users = getData(STORAGE.USERS)
  const user = users.find(u => u.email === email && u.password === password)
  if (!user) throw new Error('Invalid credentials')
  return user
}

export const register = async ({ name, email, password }) => {
  ensure()
  const users = getData(STORAGE.USERS)
  if (users.some(u => u.email === email)) throw new Error('User already exists')

  const newUser = { id: Date.now().toString(), name, email, password, role: 'user', cart: [], wishlist: [] }
  users.push(newUser)
  setData(STORAGE.USERS, users)
  return newUser
}

// Products
export const getProducts = async () => {
  ensure()
  return getData(STORAGE.PRODUCTS)
}

export const addProduct = async (product) => {
  ensure()
  const products = getData(STORAGE.PRODUCTS)
  const newProduct = { id: Date.now().toString(), ...product }
  products.push(newProduct)
  setData(STORAGE.PRODUCTS, products)
  return newProduct
}

export const updateProduct = async (id, updates) => {
  ensure()
  const products = getData(STORAGE.PRODUCTS)
  const index = products.findIndex(p => p.id === id)
  if (index === -1) throw new Error('Product not found')

  products[index] = { ...products[index], ...updates }
  setData(STORAGE.PRODUCTS, products)
  return products[index]
}

export const deleteProduct = async (id) => {
  ensure()
  const products = getData(STORAGE.PRODUCTS)
  const deleted = products.find(p => p.id === id)
  if (!deleted) throw new Error('Product not found')

  const updatedProducts = products.filter(p => p.id !== id)
  setData(STORAGE.PRODUCTS, updatedProducts)
  return deleted
}

// Users
export const getUsers = async () => {
  ensure()
  return getData(STORAGE.USERS)
}

export const updateUser = async (id, updates) => {
  ensure()
  const users = getData(STORAGE.USERS)
  const index = users.findIndex(u => u.id === id)
  if (index === -1) throw new Error('User not found')

  users[index] = { ...users[index], ...updates }
  setData(STORAGE.USERS, users)
  return users[index]
}

// User Cart & Wishlist
export const getUserCart = async (userId) => {
  ensure()
  const users = getData(STORAGE.USERS)
  const user = users.find(u => u.id === userId)
  if (!user) throw new Error('User not found')
  return user.cart || []
}

export const addToCart = async (userId, productId) => {
  ensure()
  const users = getData(STORAGE.USERS)
  const user = users.find(u => u.id === userId)
  if (!user) throw new Error('User not found')

  if (!user.cart) user.cart = []
  if (!user.cart.includes(productId)) user.cart.push(productId)
  setData(STORAGE.USERS, users)
  return user.cart
}

export const removeFromCart = async (userId, productId) => {
  ensure()
  const users = getData(STORAGE.USERS)
  const user = users.find(u => u.id === userId)
  if (!user) throw new Error('User not found')

  user.cart = (user.cart || []).filter(id => id !== productId)
  setData(STORAGE.USERS, users)
  return user.cart
}

export const getUserWishlist = async (userId) => {
  ensure()
  const users = getData(STORAGE.USERS)
  const user = users.find(u => u.id === userId)
  if (!user) throw new Error('User not found')
  return user.wishlist || []
}

export const addToWishlist = async (userId, productId) => {
  ensure()
  const users = getData(STORAGE.USERS)
  const user = users.find(u => u.id === userId)
  if (!user) throw new Error('User not found')

  if (!user.wishlist) user.wishlist = []
  if (!user.wishlist.includes(productId)) user.wishlist.push(productId)
  setData(STORAGE.USERS, users)
  return user.wishlist
}

export const removeFromWishlist = async (userId, productId) => {
  ensure()
  const users = getData(STORAGE.USERS)
  const user = users.find(u => u.id === userId)
  if (!user) throw new Error('User not found')

  user.wishlist = (user.wishlist || []).filter(id => id !== productId)
  setData(STORAGE.USERS, users)
  return user.wishlist
}

// Orders
export const getOrders = async () => {
  ensure()
  return getData(STORAGE.ORDERS)
}

export const addOrder = async (order) => {
  ensure()
  const orders = getData(STORAGE.ORDERS)
  const newOrder = { id: Date.now().toString(), ...order }
  orders.push(newOrder)
  setData(STORAGE.ORDERS, orders)
  return newOrder
}
