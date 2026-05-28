const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

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
  if (!response.ok) throw new Error('Registration failed')
  return response.json()
}

export async function login(email: string, password: string): Promise<string> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  if (!response.ok) throw new Error('Login failed')
  const data = await response.json()
  return data.access_token
}

export async function getMovies(token: string): Promise<Movie[]> {
  const response = await fetch(`${API_URL}/movies`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!response.ok) throw new Error('Failed to fetch movies')
  return response.json()
}

export async function rateMovie(token: string, movieId: number, score: number): Promise<void> {
  const response = await fetch(`${API_URL}/movies/ratings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ movie_id: movieId, score })
  })
  if (!response.ok) throw new Error('Failed to save rating')
}

export async function saveWatchlist(token: string, movieId: number, watched = false): Promise<void> {
  const response = await fetch(`${API_URL}/movies/watchlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ movie_id: movieId, watched })
  })
  if (!response.ok) throw new Error('Failed to save watchlist')
}

export async function getRecommendations(token: string): Promise<{ items: RecommendationItem[]; source: string }> {
  const response = await fetch(`${API_URL}/recommendations`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!response.ok) throw new Error('Failed to fetch recommendations')
  return response.json()
}

export async function getAdminStats(token: string): Promise<{ users: number; movies: number }> {
  const response = await fetch(`${API_URL}/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!response.ok) throw new Error('Admin access failed')
  return response.json()
}
