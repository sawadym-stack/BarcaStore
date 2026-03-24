import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children, role }) {
  const { user } = useContext(AuthContext)
  if (!user) return <Navigate to='/login' replace />
  if (role) {
    const isAdminRole = role === 'admin'
    const isUserAdmin = ['admin', 'superadmin'].includes(user.role)

    if (isAdminRole && !isUserAdmin) return <Navigate to='/' replace />
    if (!isAdminRole && user.role !== role) return <Navigate to='/' replace />
  }
  return children
}
