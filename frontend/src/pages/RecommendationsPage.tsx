import { useEffect, useState } from 'react'
import { getRecommendations, type RecommendationItem } from '../lib/api'

export default function RecommendationsPage({ token }: { token: string }) {
  const [items, setItems] = useState<RecommendationItem[]>([])
  const [source, setSource] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getRecommendations(token)
      .then((data) => {
        setItems(data.items)
        setSource(data.source)
      })
      .catch((err) => setError((err as Error).message))
  }, [token])

  return (
    <section>
      <div className="page-header">
        <h2>Recommendations</h2>
        <p>Updated based on your preferences and watch behavior.</p>
      </div>

      <p className="source-row">
        Source:
        <span className="chip source-chip">{source || 'loading'}</span>
      </p>

      {error && <p className="alert-error">{error}</p>}

      {items.length === 0 && !error ? (
        <div className="card empty-state">
          <h3>No recommendations yet</h3>
          <p>Rate a few movies first, then refresh this page.</p>
        </div>
      ) : (
        <div className="card-grid">
          {items.map((item) => (
            <article className="card" key={item.movie_id}>
              <h3>{item.title}</h3>
              <p className="movie-overview">{item.reason}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
