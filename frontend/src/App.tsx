import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { ReactNode, useMemo, useState } from 'react'
import LoginPage from './pages/LoginPage'
import MoviesPage from './pages/MoviesPage'
import RecommendationsPage from './pages/RecommendationsPage'
import AdminPage from './pages/AdminPage'

function ProtectedRoute({ token, children }: { token: string | null; children: ReactNode }) {
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))

  const authActions = useMemo(
    () => ({
      onLogin: (nextToken: string) => {
        localStorage.setItem('token', nextToken)
        setToken(nextToken)
      },
      onLogout: () => {
        localStorage.removeItem('token')
        setToken(null)
      }
    }),
    []
  )

  return (
    <div className="container app-shell">
      <header className="site-header card">
        <div>
          <p className="eyebrow">Discover</p>
          <h1>Movie AI Platform</h1>
          <p className="site-subtitle">Smart recommendations with a clean watch-and-rate workflow.</p>
        </div>

        <nav className="site-nav">
          <Link className="nav-pill" to="/movies">Movies</Link>
          <Link className="nav-pill" to="/recommendations">Recommendations</Link>
          <Link className="nav-pill" to="/admin">Admin</Link>
          {!token ? (
            <Link className="nav-pill nav-primary" to="/login">Login</Link>
          ) : (
            <button className="nav-pill nav-primary" onClick={authActions.onLogout}>Logout</button>
          )}
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={authActions.onLogin} />} />
          <Route
            path="/movies"
            element={
              <ProtectedRoute token={token}>
                <MoviesPage token={token!} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recommendations"
            element={
              <ProtectedRoute token={token}>
                <RecommendationsPage token={token!} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute token={token}>
                <AdminPage token={token!} />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to={token ? '/movies' : '/login'} replace />} />
        </Routes>
      </main>
    </div>
  )
}
