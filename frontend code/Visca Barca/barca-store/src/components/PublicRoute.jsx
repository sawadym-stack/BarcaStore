import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'

export default function PublicRoute({ children }) {
  const { user } = useContext(AuthContext)
  
  if (user) {
    const isAdmin = ['admin', 'superadmin'].includes(user.role)
    return <Navigate to={isAdmin ? '/admin' : '/'} replace />
  }
  
  return children
}
