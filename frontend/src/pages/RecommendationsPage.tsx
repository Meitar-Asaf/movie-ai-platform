import { useEffect, useState } from 'react'
import { getRecommendations, type RecommendationItem } from '../lib/api'

export default function RecommendationsPage({ token }: { token: string }) {
  const [items, setItems] = useState<RecommendationItem[]>([])
  const [source, setSource] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  async function loadRecommendations() {
    try {
      setIsRefreshing(true)
      setError(null)
      const data = await getRecommendations(token)
      setItems(data.items)
      setSource(data.source)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadRecommendations()
  }, [token])

  return (
    <section>
      <div className="page-header">
        <h2>Recommendations</h2>
        <p>Updated based on your preferences and watch behavior.</p>
      </div>

      <div className="page-tools">
        <button className="ghost-btn" onClick={loadRecommendations} disabled={isRefreshing}>
          {isRefreshing ? 'Refreshing...' : 'Refresh recommendations'}
        </button>
      </div>

      <p className="source-row">
        Source:
        <span className="chip source-chip">{source || 'loading'}</span>
      </p>

      {source === 'fallback' && !error && (
        <p className="page-note">AI source is currently limited (quota/rate-limit). Showing smart fallback picks.</p>
      )}

      {error && <p className="alert-error">{error}</p>}

      {items.length === 0 && !error ? (
        <div className="card empty-state">
          <h3>No recommendations yet</h3>
          <p>Rate a few movies first, then refresh this page.</p>
        </div>
      ) : (
        <div className="card-grid">
          {items.map((item) => (
            <article className="card" key={item.movie_key}>
              <img className="poster" src={item.poster_url} alt={`${item.title} poster`} loading="lazy" />
              <h3>{item.title}</h3>
              <p className="movie-meta">
                {[item.year, item.genres].filter(Boolean).join(' • ') || 'Recommended for you'}
              </p>
              <p className="movie-overview">{item.reason}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
