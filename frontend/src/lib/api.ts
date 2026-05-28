const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

type ApiErrorPayload = {
  detail?: string | Array<{ msg?: string }>
}

type ApiFieldDetail = {
  loc?: Array<string | number>
  msg?: string
}

type ApiValidationPayload = {
  detail?: ApiFieldDetail[]
}

export class ApiRequestError extends Error {
  status: number
  fieldErrors: Record<string, string>

  constructor(message: string, status: number, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

function toFieldLabel(field: string): string {
  const map: Record<string, string> = {
    email: 'Email',
    full_name: 'Full name',
    password: 'Password',
  }
  return map[field] ?? field
}

async function buildApiRequestError(response: Response, fallback: string): Promise<ApiRequestError> {
  const status = response.status

  if (status === 401) {
    return new ApiRequestError('Email or password does not match our records.', status)
  }

  try {
    const validationPayload = (await response.clone().json()) as ApiValidationPayload
    if (Array.isArray(validationPayload.detail) && validationPayload.detail.length > 0) {
      const fieldErrors: Record<string, string> = {}
      const messages: string[] = []

      validationPayload.detail.forEach((item) => {
        const maybeField = item.loc?.[item.loc.length - 1]
        if (typeof maybeField === 'string' && item.msg) {
          const sentence = `${toFieldLabel(maybeField)}: ${item.msg}`
          fieldErrors[maybeField] = sentence
          messages.push(sentence)
        }
      })

      if (messages.length > 0) {
        return new ApiRequestError(messages.join('. '), status, fieldErrors)
      }
    }
  } catch {
    // Continue to generic payload parsing.
  }

  try {
    const payload = (await response.json()) as ApiErrorPayload
    if (typeof payload.detail === 'string' && payload.detail.trim().length > 0) {
      const detail = payload.detail.trim()
      if (detail.toLowerCase().includes('email already registered')) {
        return new ApiRequestError('An account with this email already exists. Try login instead.', status, {
          email: 'An account with this email already exists.',
        })
      }
      return new ApiRequestError(detail, status)
    }
  } catch {
    // fall through
  }

  return new ApiRequestError(fallback, status)
}

async function buildErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as ApiErrorPayload
    if (typeof payload.detail === 'string' && payload.detail.trim().length > 0) {
      return payload.detail
    }

    if (Array.isArray(payload.detail) && payload.detail.length > 0) {
      const messages = payload.detail
        .map((item) => item?.msg?.trim())
        .filter((msg): msg is string => Boolean(msg))
      if (messages.length > 0) {
        return messages.join('. ')
      }
    }
  } catch {
    // Fall through to default error message when response body is not JSON.
  }

  return fallback
}

export type Movie = {
  id: number
  title: string
  year: number | null
  genres: string
  overview: string | null
}

export type RecommendationItem = {
  movie_id: number
  title: string
  reason: string
}

export async function register(email: string, fullName: string, password: string) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, full_name: fullName, password })
  })
  if (!response.ok) throw await buildApiRequestError(response, 'Registration failed')
  return response.json()
}

export async function login(email: string, password: string): Promise<string> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  if (!response.ok) throw await buildApiRequestError(response, 'Login failed')
  const data = await response.json()
  return data.access_token
}

export async function getMovies(token: string): Promise<Movie[]> {
  const response = await fetch(`${API_URL}/movies`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!response.ok) throw new Error(await buildErrorMessage(response, 'Failed to fetch movies'))
  return response.json()
}

export async function rateMovie(token: string, movieId: number, score: number): Promise<void> {
  const response = await fetch(`${API_URL}/movies/ratings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ movie_id: movieId, score })
  })
  if (!response.ok) throw new Error(await buildErrorMessage(response, 'Failed to save rating'))
}

export async function saveWatchlist(token: string, movieId: number, watched = false): Promise<void> {
  const response = await fetch(`${API_URL}/movies/watchlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ movie_id: movieId, watched })
  })
  if (!response.ok) throw new Error(await buildErrorMessage(response, 'Failed to save watchlist'))
}

export async function getRecommendations(token: string): Promise<{ items: RecommendationItem[]; source: string }> {
  const response = await fetch(`${API_URL}/recommendations`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!response.ok) throw new Error(await buildErrorMessage(response, 'Failed to fetch recommendations'))
  return response.json()
}

export async function getAdminStats(token: string): Promise<{ users: number; movies: number }> {
  const response = await fetch(`${API_URL}/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!response.ok) throw new Error(await buildErrorMessage(response, 'Admin access failed'))
  return response.json()
}
