import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { loginUser, logoutUser, registerUser, subscribeToAuth } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToAuth((nextProfile) => {
      setProfile(nextProfile)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function login(credentials) {
    const user = await loginUser(credentials)
    setProfile(user)
    setLoading(false)
    return user
  }

  async function register(data) {
    const user = await registerUser(data)
    setProfile(user)
    setLoading(false)
    return user
  }

  async function logout() {
    await logoutUser()
    setProfile(null)
  }

  const value = useMemo(
    () => ({
      profile,
      loading,
      login,
      register,
      logout,
      isAdmin: profile?.role === 'admin',
      canCreate: profile?.role === 'admin' || profile?.role === 'creator',
    }),
    [profile, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside an AuthProvider.')
  return context
}
