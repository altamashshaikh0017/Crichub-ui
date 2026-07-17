import { useCallback, useMemo, useState } from 'react'
import { getCurrentUser, login as apiLogin, logout as apiLogout } from '../api/auth'
import { AuthContext } from './AuthContext'

/**
 * Holds the logged-in user in React state so the UI (navbar, protected routes)
 * re-renders on sign in / sign out. The source of truth for persistence still
 * lives in api/auth.js — this just mirrors it into the component tree.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(getCurrentUser)

  const signIn = useCallback(async (credentials) => {
    const session = await apiLogin(credentials)
    setUser({ userId: session.userId, email: session.email })
    return session
  }, [])

  const signOut = useCallback(() => {
    apiLogout()
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, signIn, signOut }), [user, signIn, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
