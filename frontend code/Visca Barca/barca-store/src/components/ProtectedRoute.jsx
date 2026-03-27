import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children, role, allowGuest = false }) {
  const { user } = useContext(AuthContext)
  
  const isUserAdmin = user && ['admin', 'superadmin'].includes(user.role)

  // If a role is required, user must be logged in
  if (!allowGuest && !user) return <Navigate to='/login' replace />

  // If we want to exclude admins from certain public pages (like Home/Shop)
  if (allowGuest && isUserAdmin) return <Navigate to='/admin' replace />

  if (role) {
    const isAdminRole = role === 'admin'

    if (isAdminRole && !isUserAdmin) return <Navigate to='/' replace />
    if (!isAdminRole && user?.role !== role) {
      // If admin tries to access user route, send to admin dashboard
      if (isUserAdmin) return <Navigate to='/admin' replace />
      return <Navigate to='/' replace />
    }
  }
  return children
}
