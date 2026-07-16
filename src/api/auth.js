import { api, tokenStore } from './client'

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
 * POST /api/auth/login — stores the JWT on success.
 * @returns {Promise<{token, tokenType, userId, email}>}
 */
export async function login({ email, password }) {
  const session = await api.post('/api/auth/login', { email, password }, { auth: false })
  if (session?.token) tokenStore.set(session.token)
  return session
}

export function logout() {
  tokenStore.clear()
}

export function isAuthenticated() {
  return Boolean(tokenStore.get())
}

/** Mirrors com.as.crichub.enums.PlayingRole */
export const PLAYING_ROLES = [
  { value: 'BATSMAN', label: 'Batsman' },
  { value: 'BOWLER', label: 'Bowler' },
  { value: 'ALL_ROUNDER', label: 'All-rounder' },
  { value: 'WICKET_KEEPER', label: 'Wicket-keeper' },
]
