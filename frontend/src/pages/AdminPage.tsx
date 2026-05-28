import { useEffect, useState } from 'react'
import { getAdminStats } from '../lib/api'

export default function AdminPage({ token }: { token: string }) {
  const [stats, setStats] = useState<{ users: number; movies: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAdminStats(token)
      .then(setStats)
      .catch((err) => setError((err as Error).message))
  }, [token])

  return (
    <div>
      <h2>Admin</h2>
      {error && <p>{error}</p>}
      {stats && (
        <div className="card">
          <p>Users: {stats.users}</p>
          <p>Movies: {stats.movies}</p>
        </div>
      )}
      {!stats && !error && <p>Only admins can access this page.</p>}
    </div>
  )
}
