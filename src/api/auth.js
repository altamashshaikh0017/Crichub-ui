import { api, tokenStore } from './client'

const SESSION_KEY = 'crichub.session'

/**
 * The identity we keep about the logged-in user, alongside the JWT. The login
 * response carries no name, so `email` is all we have to greet them with.
 */
export const sessionStore = {
  get() {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  },
  set: (session) => localStorage.setItem(SESSION_KEY, JSON.stringify(session)),
  clear: () => localStorage.removeItem(SESSION_KEY),
}

/**
 * POST /api/auth/signup
 * @param {{firstName, lastName, email, mobileNumber, password, playingRole,
 *          battingStyle?, bowlingStyle?}} form
 * @returns {Promise<number>} the new user id
 */
export function signup(form) {
  return api.post('/api/auth/signup', form, { auth: false })
}

/**
 * POST /api/auth/login — persists the JWT and the user's identity on success.
 * @returns {Promise<{token, tokenType, userId, email}>}
 */
export async function login({ email, password }) {
  const session = await api.post('/api/auth/login', { email, password }, { auth: false })
  if (session?.token) {
    tokenStore.set(session.token)
    sessionStore.set({ userId: session.userId, email: session.email })
  }
  return session
}

export function logout() {
  tokenStore.clear()
  sessionStore.clear()
}

export function isAuthenticated() {
  return Boolean(tokenStore.get())
}

/** The persisted user, or null when signed out. */
export function getCurrentUser() {
  return isAuthenticated() ? sessionStore.get() : null
}

/** Mirrors com.as.crichub.enums.PlayingRole */
export const PLAYING_ROLES = [
  { value: 'BATSMAN', label: 'Batsman' },
  { value: 'BOWLER', label: 'Bowler' },
  { value: 'ALL_ROUNDER', label: 'All-rounder' },
  { value: 'WICKET_KEEPER', label: 'Wicket-keeper' },
]

/**
 * Frontend-defined values. The backend stores `battingStyle` as a free String
 * (no enum), so any value here is accepted verbatim — these options exist only
 * to keep the input consistent.
 */
export const BATTING_STYLES = [
  { value: 'RIGHT_HANDED', label: 'Right-handed' },
  { value: 'LEFT_HANDED', label: 'Left-handed' },
]

/**
 * Frontend-defined values. The backend stores `bowlingStyle` as a free String
 * (no enum), so any value here is accepted verbatim — these options exist only
 * to keep the input consistent.
 */
export const BOWLING_STYLES = [
  { value: 'RIGHT_ARM_FAST', label: 'Right-arm fast' },
  { value: 'RIGHT_ARM_MEDIUM', label: 'Right-arm medium' },
  { value: 'RIGHT_ARM_OFF_BREAK', label: 'Right-arm off-break' },
  { value: 'RIGHT_ARM_LEG_BREAK', label: 'Right-arm leg-break' },
  { value: 'LEFT_ARM_FAST', label: 'Left-arm fast' },
  { value: 'LEFT_ARM_MEDIUM', label: 'Left-arm medium' },
  { value: 'LEFT_ARM_ORTHODOX', label: 'Left-arm orthodox' },
  { value: 'LEFT_ARM_CHINAMAN', label: 'Left-arm chinaman' },
]
