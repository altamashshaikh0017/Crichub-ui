import { api } from './client'

/** GET /api/teams/:teamId/players — the team's squad. */
export function getSquad(teamId, options) {
  return api.get(`/api/teams/${teamId}/players`, options)
}

/**
 * POST /api/teams/:teamId/players — add a player. If `mobileNumber` matches an
 * existing player, the backend links that player; otherwise it creates a guest.
 * @param {{playerName, playingRole, battingStyle?, bowlingStyle?, mobileNumber?, jerseyNumber?}} payload
 */
export function addSquadPlayer(teamId, payload) {
  return api.post(`/api/teams/${teamId}/players`, payload)
}

/** DELETE /api/teams/:teamId/players/:teamPlayerId — remove a roster entry. */
export function removeSquadPlayer(teamId, teamPlayerId) {
  return api.del(`/api/teams/${teamId}/players/${teamPlayerId}`)
}
