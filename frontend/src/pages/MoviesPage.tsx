import { useEffect, useState } from 'react'
import { createMovie, getMovies, rateMovie, saveWatchlist, type Movie } from '../lib/api'

export default function MoviesPage({ token }: { token: string }) {
  const [movies, setMovies] = useState<Movie[]>([])
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [title, setTitle] = useState('')
  const [year, setYear] = useState('')
  const [genres, setGenres] = useState('')
  const [overview, setOverview] = useState('')
  const [isCreating, setIsCreating] = useState(false)

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

  async function handleCreateMovie(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setFeedback(null)

    if (title.trim().length < 1) {
      setError('Movie title is required.')
      return
    }

    const parsedYear = year.trim().length > 0 ? Number(year) : undefined
    if (parsedYear !== undefined && (!Number.isInteger(parsedYear) || parsedYear < 1888 || parsedYear > 2100)) {
      setError('Year must be a number between 1888 and 2100.')
      return
    }

    setIsCreating(true)
    try {
      const created = await createMovie(token, {
        title: title.trim(),
        year: parsedYear,
        genres: genres.trim() || undefined,
        overview: overview.trim() || undefined,
      })
      setMovies((prev) => [created, ...prev])
      setTitle('')
      setYear('')
      setGenres('')
      setOverview('')
      setFeedback('New movie added successfully.')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <section>
      <div className="page-header">
        <h2>Movies</h2>
        <p>Browse titles, rate instantly, and build your watchlist in one place.</p>
      </div>

      <form className="card search-form" onSubmit={handleSearch}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by movie title"
        />
        <button type="submit">Search</button>
      </form>

      <form className="card create-movie-form" onSubmit={handleCreateMovie}>
        <h3>Add a movie</h3>
        <div className="form-grid">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title *"
            required
          />
          <input
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="Year (optional)"
            inputMode="numeric"
          />
          <input
            value={genres}
            onChange={(e) => setGenres(e.target.value)}
            placeholder="Genres (optional)"
          />
          <input
            value={overview}
            onChange={(e) => setOverview(e.target.value)}
            placeholder="Overview (optional)"
          />
        </div>
        <div className="card-actions">
          <button type="submit" disabled={isCreating}>{isCreating ? 'Adding...' : 'Add movie'}</button>
        </div>
      </form>

      {error && <p className="alert-error">{error}</p>}
      {feedback && <p className="alert-success">{feedback}</p>}

      {movies.length === 0 && !error ? (
        <div className="card empty-state">
          <h3>No movies yet</h3>
          <p>Try searching a broader term or refresh to regenerate the AI catalog.</p>
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
