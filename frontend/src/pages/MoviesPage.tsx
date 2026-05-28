import { useEffect, useState } from 'react'
import { getMovies, rateMovie, saveWatchlist, type Movie } from '../lib/api'

export default function MoviesPage({ token }: { token: string }) {
  const [movies, setMovies] = useState<Movie[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getMovies(token)
      .then(setMovies)
      .catch((err) => setError((err as Error).message))
  }, [token])

  async function handleRate(movieId: number, score: number) {
    try {
      await rateMovie(token, movieId, score)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function handleWatchlist(movieId: number) {
    try {
      await saveWatchlist(token, movieId)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div>
      <h2>Movies</h2>
      {error && <p>{error}</p>}
      {movies.map((movie) => (
        <div className="card" key={movie.id}>
          <h3>{movie.title} {movie.year ? `(${movie.year})` : ''}</h3>
          <p>{movie.genres}</p>
          <p>{movie.overview}</p>
          <div>
            <button onClick={() => handleRate(movie.id, 8)}>Like (8)</button>
            <button onClick={() => handleRate(movie.id, 10)}>Love (10)</button>
            <button onClick={() => handleWatchlist(movie.id)}>Add Watchlist</button>
          </div>
        </div>
      ))}
    </div>
  )
}
