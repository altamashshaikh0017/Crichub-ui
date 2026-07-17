import { createContext, useContext } from 'react'

/**
 * Auth context: the logged-in user plus signIn/signOut. Kept in its own
 * non-component module so the provider file can stay fast-refresh friendly.
 * The provider lives in AuthProvider.jsx.
 */
export const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
