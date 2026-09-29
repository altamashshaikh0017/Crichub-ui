import { api } from './client'

/** GET /api/matches — every match, newest first. */
export function getMatches(options) {
  return api.get('/api/matches', options)
}

/** GET /api/matches/:id — a single match. */
export function getMatch(matchId, options) {
  return api.get(`/api/matches/${matchId}`, options)
}

/** GET /api/tournaments/:id/matches — matches belonging to a tournament. */
export function getTournamentMatches(tournamentId, options) {
  return api.get(`/api/tournaments/${tournamentId}/matches`, options)
}

/** POST /api/matches — create a match (tournament fixture or standalone). */
export function createMatch(payload) {
  return api.post('/api/matches', payload)
}

/** PUT /api/matches/:id — update a match's schedule. */
export function updateMatch(matchId, payload) {
  return api.put(`/api/matches/${matchId}`, payload)
}

/** POST /api/matches/:id/result — record toss + result and mark completed. */
export function recordResult(matchId, payload) {
  return api.post(`/api/matches/${matchId}/result`, payload)
}

/** DELETE /api/matches/:id — delete a match. */
export function deleteMatch(matchId) {
  return api.del(`/api/matches/${matchId}`)
}
