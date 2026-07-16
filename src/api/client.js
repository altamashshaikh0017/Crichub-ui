/**
 * Thin fetch wrapper around the CricHub Spring Boot API.
 *
 * Success bodies are a `ResponseBean` envelope:
 *   { success, message, statusCode, data }
 *
 * Failure bodies are NOT uniform — GlobalExceptionHandler returns a bare string
 * for some exceptions and a JSON object (with `message`, sometimes a per-field
 * `errors` map) for others. `parseError` normalises both.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8089'

const TOKEN_KEY = 'crichub.token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  constructor(message, { status = 0, fieldErrors = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    /** Map of field name -> validation message, when the API supplies one. */
    this.fieldErrors = fieldErrors
  }
}

async function readBody(response) {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function parseError(body, status) {
  if (typeof body === 'string' && body.trim()) {
    return new ApiError(body, { status })
  }
  if (body && typeof body === 'object') {
    return new ApiError(body.message ?? `Request failed with status ${status}`, {
      status,
      fieldErrors: body.errors ?? null,
    })
  }
  return new ApiError(`Request failed with status ${status}`, { status })
}

/**
 * @returns the `data` field of the ResponseBean envelope.
 * @throws {ApiError} on a transport failure or any non-2xx response.
 */
export async function apiRequest(path, { method = 'GET', body, auth = true, signal } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const token = auth ? tokenStore.get() : null
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch {
    throw new ApiError(`Cannot reach the CricHub API at ${BASE_URL}. Is it running?`)
  }

  const payload = await readBody(response)

  if (!response.ok) throw parseError(payload, response.status)

  // A 2xx that still carries success:false shouldn't be treated as a win.
  if (payload && typeof payload === 'object' && payload.success === false) {
    throw parseError(payload, response.status)
  }

  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload
}

export const api = {
  get: (path, options) => apiRequest(path, { ...options, method: 'GET' }),
  post: (path, body, options) => apiRequest(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => apiRequest(path, { ...options, method: 'PUT', body }),
  del: (path, options) => apiRequest(path, { ...options, method: 'DELETE' }),
}
