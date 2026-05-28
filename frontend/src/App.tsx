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
    <div className="container">
      <h1>Movie AI Platform</h1>
      <nav>
        <Link to="/movies">Movies</Link>
        <Link to="/recommendations">Recommendations</Link>
        <Link to="/admin">Admin</Link>
        {!token ? <Link to="/login">Login</Link> : <button onClick={authActions.onLogout}>Logout</button>}
      </nav>

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
    </div>
  )
}
