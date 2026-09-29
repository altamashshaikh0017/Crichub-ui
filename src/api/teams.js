import { api } from './client'

/** GET /api/teams — the current user's teams. */
export function getMyTeams(options) {
  return api.get('/api/teams', options)
}

/** GET /api/teams/:id — a single team you own. */
export function getTeam(teamId, options) {
  return api.get(`/api/teams/${teamId}`, options)
}

/** POST /api/teams — create a team. */
export function createTeam(payload) {
  return api.post('/api/teams', payload)
}

/** PUT /api/teams/:id — update one of your teams. */
export function updateTeam(teamId, payload) {
  return api.put(`/api/teams/${teamId}`, payload)
}

/** DELETE /api/teams/:id — delete one of your teams. */
export function deleteTeam(teamId) {
  return api.del(`/api/teams/${teamId}`)
}
