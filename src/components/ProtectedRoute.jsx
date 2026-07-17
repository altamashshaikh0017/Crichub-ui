import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

/**
 * Gate for authenticated-only routes. Sends signed-out visitors to the login
 * page, remembering where they were headed so login can return them there.
 */
export default function ProtectedRoute({ children }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return children
}
