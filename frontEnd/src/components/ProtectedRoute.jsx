import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  // Admin can access delivery routes too
  if (role === 'admin' && user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  if (role === 'delivery' && user.role !== 'delivery' && user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}
