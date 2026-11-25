import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Spinner from './Spinner'

export default function RequireAuth({ roles, children }) {
  const { profile, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Spinner label="Checking your account…" />
  if (!profile) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (roles && !roles.includes(profile.role)) {
    return <Navigate to="/forbidden" replace />
  }

  return children
}
