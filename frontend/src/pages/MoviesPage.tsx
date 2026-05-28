import { useEffect, useState } from 'react'
import { getMovies, rateMovie, saveWatchlist, type Movie } from '../lib/api'

export default function MoviesPage({ token }: { token: string }) {
  const [movies, setMovies] = useState<Movie[]>([])
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    getMovies(token)
      .then(setMovies)
      .catch((err) => setError((err as Error).message))
  }, [token])

  async function handleRate(movieId: number, score: number) {
    try {
      await rateMovie(token, movieId, score)
      setFeedback(score >= 10 ? 'Saved: Loved this movie.' : 'Saved: Rating updated.')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function handleWatchlist(movieId: number) {
    try {
      await saveWatchlist(token, movieId)
      setFeedback('Saved to watchlist.')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <section>
      <div className="page-header">
        <h2>Movies</h2>
        <p>Browse titles, rate instantly, and build your watchlist in one place.</p>
      </div>

      {error && <p className="alert-error">{error}</p>}
      {feedback && <p className="alert-success">{feedback}</p>}

      {movies.length === 0 && !error ? (
        <div className="card empty-state">
          <h3>No movies yet</h3>
          <p>Add movies in the backend or seed script, then refresh this page.</p>
        </div>
      ) : (
        <div className="card-grid">
          {movies.map((movie) => (
            <article className="card movie-card" key={movie.id}>
              <div className="movie-card-head">
                <h3>{movie.title}</h3>
                {movie.year ? <span className="chip">{movie.year}</span> : null}
              </div>

              {movie.genres && <p className="movie-meta">{movie.genres}</p>}
              <p className="movie-overview">{movie.overview || 'No overview provided yet.'}</p>

              <div className="card-actions">
                <button onClick={() => handleRate(movie.id, 8)}>Like (8)</button>
                <button onClick={() => handleRate(movie.id, 10)}>Love (10)</button>
                <button className="ghost-btn" onClick={() => handleWatchlist(movie.id)}>Add Watchlist</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
