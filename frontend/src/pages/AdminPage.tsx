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
    <section>
      <div className="page-header">
        <h2>Admin</h2>
        <p>Monitor platform usage and content inventory.</p>
      </div>

      {error && <p className="alert-error">{error}</p>}

      {stats && (
        <div className="stats-grid">
          <article className="card stat-card">
            <p className="stat-label">Users</p>
            <p className="stat-value">{stats.users}</p>
          </article>
          <article className="card stat-card">
            <p className="stat-label">Movies</p>
            <p className="stat-value">{stats.movies}</p>
          </article>
        </div>
      )}

      {!stats && !error && (
        <div className="card empty-state">
          <h3>Restricted area</h3>
          <p>Only users with admin role can access this page.</p>
        </div>
      )}
    </section>
  )
}
