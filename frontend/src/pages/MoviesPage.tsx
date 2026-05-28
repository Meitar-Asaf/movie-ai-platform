import { useEffect, useState } from 'react'
import { getMovies, rateMovie, saveWatchlist, type Movie } from '../lib/api'

export default function MoviesPage({ token }: { token: string }) {
  const [movies, setMovies] = useState<Movie[]>([])
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  async function loadMovies(search?: string) {
    try {
      const data = await getMovies(token, search)
      setMovies(data)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  useEffect(() => {
    loadMovies()
  }, [token])

  async function handleRate(movie: Movie, score: number) {
    try {
      await rateMovie(
        token,
        {
          title: movie.title,
          year: movie.year ?? undefined,
          genres: movie.genres,
          overview: movie.overview ?? undefined,
          poster_url: movie.poster_url,
        },
        score,
      )
      setFeedback(score >= 10 ? 'Saved: Loved this movie.' : 'Saved: Rating updated.')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function handleWatchlist(movie: Movie) {
    try {
      await saveWatchlist(token, {
        title: movie.title,
        year: movie.year ?? undefined,
        poster_url: movie.poster_url,
      })
      setFeedback('Saved to watchlist.')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setFeedback(null)
    await loadMovies(query)
  }

  return (
    <section>
      <div className="page-header">
        <h2>Movies</h2>
        <p>AI builds your movie feed from your likes. Rate movies to improve results.</p>
      </div>

      <form className="card search-form" onSubmit={handleSearch}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by movie title"
        />
        <button type="submit">Search</button>
      </form>

      {error && <p className="alert-error">{error}</p>}
      {feedback && <p className="alert-success">{feedback}</p>}

      {movies.length === 0 && !error ? (
        <div className="card empty-state">
          <h3>No AI picks yet</h3>
          <p>Rate a few movies with high scores, then refresh to get personalized AI picks.</p>
        </div>
      ) : (
        <div className="card-grid">
          {movies.map((movie) => (
            <article className="card movie-card" key={movie.movie_key}>
              <img className="poster" src={movie.poster_url} alt={`${movie.title} poster`} loading="lazy" />
              <div className="movie-card-head">
                <h3>{movie.title}</h3>
                {movie.year ? <span className="chip">{movie.year}</span> : null}
              </div>

              {movie.genres && <p className="movie-meta">{movie.genres}</p>}
              <p className="movie-overview">{movie.overview || 'No overview provided yet.'}</p>

              <div className="card-actions">
                <button onClick={() => handleRate(movie, 8)}>Like (8)</button>
                <button onClick={() => handleRate(movie, 10)}>Love (10)</button>
                <button className="ghost-btn" onClick={() => handleWatchlist(movie)}>Add Watchlist</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
