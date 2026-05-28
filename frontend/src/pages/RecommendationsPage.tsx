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
    <div>
      <h2>Recommendations</h2>
      <p>Source: {source}</p>
      {error && <p>{error}</p>}
      {items.map((item) => (
        <div className="card" key={item.movie_id}>
          <h3>{item.title}</h3>
          <p>{item.reason}</p>
        </div>
      ))}
    </div>
  )
}
