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
    // Hard navigation to home. An SPA route change here races ProtectedRoute:
    // clearing the user re-renders the protected page, which redirects to
    // /login before the route settles. A full load leaves the protected tree
    // outright and boots from cleared storage as a signed-out visitor.
    window.location.assign('/')
  }, [])

  const value = useMemo(() => ({ user, signIn, signOut }), [user, signIn, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
