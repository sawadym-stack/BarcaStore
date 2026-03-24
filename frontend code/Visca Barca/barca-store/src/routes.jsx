import { Routes, Route } from 'react-router-dom'
import Home from './pages/User/Home'
import Shop from './pages/User/Shop'
import ProductDetails from './pages/User/ProductDetails'
import Checkout from './pages/User/Checkout'
import OrderConfirmed from './pages/User/OrderConfirmed'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import ForgotPassword from './pages/Auth/ForgotPassword'
import Profile from './pages/User/Profile'
import Cart from './pages/User/Cart'
import Wishlist from './pages/User/Wishlist'

import AdminDashboard from './pages/Admin/Dashboard'
import AdminProducts from './pages/Admin/Products'
import AdminUsers from './pages/Admin/Users'

import ProtectedRoute from './components/ProtectedRoute'
import { Import } from 'lucide-react'
import AdminOrders from './pages/Admin/AdminOrders'
import AdminCoupons from './pages/Admin/AdminCoupons'

export default function RoutesList() {
  return (
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/shop' element={<Shop />} />
      <Route path='/product/:id' element={<ProductDetails />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/order-confirmed" element={<OrderConfirmed />} />



      <Route path='/login' element={<Login />} />
      <Route path='/register' element={<Register />} />
      <Route path='/forgot-password' element={<ForgotPassword />} />

      <Route path='/profile' element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path='/cart' element={<ProtectedRoute><Cart /></ProtectedRoute>} />
      <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />

      <Route path='/admin' element={<ProtectedRoute role='admin'><AdminDashboard /></ProtectedRoute>} />
      <Route path='/admin/products' element={<ProtectedRoute role='admin'><AdminProducts /></ProtectedRoute>} />
      <Route path='/admin/users' element={<ProtectedRoute role='admin'><AdminUsers /></ProtectedRoute>} />
      <Route path='/admin/orders' element={<ProtectedRoute role='admin'><AdminOrders /></ProtectedRoute>} />
      <Route path='/admin/coupons' element={<ProtectedRoute role='admin'><AdminCoupons /></ProtectedRoute>} />

      <Route path='*' element={<div className="p-12 text-center">Page not found</div>} />
    </Routes>
  )
}
