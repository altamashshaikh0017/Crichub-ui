import { api } from './client'

/**
 * GET /api/players/me — the profile of the logged-in user.
 * @returns {Promise<{playerId, playerName, firstName, lastName, email,
 *   mobileNumber, playingRole, battingStyle, bowlingStyle}>}
 */
export function getMyProfile(options) {
  return api.get('/api/players/me', options)
}

/**
 * PUT /api/players/me — update the editable profile fields.
 * @param {{playerName, playingRole, battingStyle?, bowlingStyle?}} payload
 * @returns {Promise<object>} the updated profile
 */
export function updateMyProfile(payload) {
  return api.put('/api/players/me', payload)
}

/** GET /api/players/:id/stats — a player's aggregated career stats. */
export function getPlayerStats(playerId, options) {
  return api.get(`/api/players/${playerId}/stats`, options)
}
