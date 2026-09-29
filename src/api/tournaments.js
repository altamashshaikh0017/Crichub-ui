import { api } from './client'

/** GET /api/tournaments — every tournament, newest first. */
export function getTournaments(options) {
  return api.get('/api/tournaments', options)
}

/** GET /api/tournaments/:id — a single tournament. */
export function getTournament(tournamentId, options) {
  return api.get(`/api/tournaments/${tournamentId}`, options)
}

/** POST /api/tournaments — create a tournament. */
export function createTournament(payload) {
  return api.post('/api/tournaments', payload)
}

/** PUT /api/tournaments/:id — update a tournament. */
export function updateTournament(tournamentId, payload) {
  return api.put(`/api/tournaments/${tournamentId}`, payload)
}

/** DELETE /api/tournaments/:id — delete a tournament and its registrations. */
export function deleteTournament(tournamentId) {
  return api.del(`/api/tournaments/${tournamentId}`)
}

/** GET /api/tournaments/:id/teams — the teams registered for a tournament. */
export function getRegisteredTeams(tournamentId, options) {
  return api.get(`/api/tournaments/${tournamentId}/teams`, options)
}

/** POST /api/tournaments/:id/teams — register an existing team by id. */
export function registerTeam(tournamentId, teamId) {
  return api.post(`/api/tournaments/${tournamentId}/teams`, { teamId })
}

/** DELETE /api/tournaments/:id/teams/:registrationId — remove a registration. */
export function unregisterTeam(tournamentId, registrationId) {
  return api.del(`/api/tournaments/${tournamentId}/teams/${registrationId}`)
}
