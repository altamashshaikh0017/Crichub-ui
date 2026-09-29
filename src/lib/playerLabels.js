import { PLAYING_ROLES, BATTING_STYLES, BOWLING_STYLES } from '../api/auth'

/* Prefer the human labels the signup form used; fall back to humanising any
   value the API returns (batting/bowling style are free strings server-side). */
const toMap = (options) => Object.fromEntries(options.map((o) => [o.value, o.label]))
const ROLE_LABELS = toMap(PLAYING_ROLES)
const BAT_LABELS = toMap(BATTING_STYLES)
const BOWL_LABELS = toMap(BOWLING_STYLES)

export function humanize(value) {
  if (!value) return null
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase().replace(/_/g, ' ')
}

export const NOT_SET = 'Not set'
export const roleLabel = (v) => ROLE_LABELS[v] ?? humanize(v) ?? NOT_SET
export const batLabel = (v) => BAT_LABELS[v] ?? humanize(v) ?? NOT_SET
export const bowlLabel = (v) => BOWL_LABELS[v] ?? humanize(v) ?? NOT_SET
