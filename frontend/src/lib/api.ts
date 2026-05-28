const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

type ApiErrorPayload = {
  detail?: string | Array<{ msg?: string }>
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
  if (!response.ok) throw new Error(await buildErrorMessage(response, 'Registration failed'))
  return response.json()
}

export async function login(email: string, password: string): Promise<string> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  if (!response.ok) throw new Error(await buildErrorMessage(response, 'Login failed'))
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
