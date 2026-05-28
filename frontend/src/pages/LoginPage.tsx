import { FormEvent, useState } from 'react'
import { ApiRequestError, login, register } from '../lib/api'

type FormErrors = {
  fullName?: string
  email?: string
  password?: string
}

function validateForm(email: string, fullName: string, password: string, isRegister: boolean): FormErrors {
  const errors: FormErrors = {}

  if (isRegister) {
    if (fullName.trim().length < 2) {
      errors.fullName = 'Full name must include at least 2 characters.'
    } else if (fullName.trim().length > 120) {
      errors.fullName = 'Full name cannot exceed 120 characters.'
    }
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(email)) {
    errors.email = 'Please enter a valid email address.'
  }

  if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  } else if (password.length > 128) {
    errors.password = 'Password cannot exceed 128 characters.'
  } else if (!/[A-Z]/.test(password)) {
    errors.password = 'Password must include at least one uppercase letter.'
  } else if (!/[a-z]/.test(password)) {
    errors.password = 'Password must include at least one lowercase letter.'
  } else if (!/[0-9]/.test(password)) {
    errors.password = 'Password must include at least one number.'
  }

  return errors
}

export default function LoginPage({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const nextErrors = validateForm(email.trim(), fullName.trim(), password, isRegister)
    setFormErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      if (isRegister) {
        await register(email.trim(), fullName.trim(), password)
      }
      const token = await login(email.trim(), password)
      onLogin(token)
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message)
        setFormErrors((prev) => ({
          ...prev,
          fullName: err.fieldErrors.full_name ?? prev.fullName,
          email: err.fieldErrors.email ?? prev.email,
          password: err.fieldErrors.password ?? prev.password,
        }))
      } else {
        setError((err as Error).message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-layout">
      <section className="auth-hero card">
        <p className="eyebrow">Movie AI Platform</p>
        <h2>Find your next favorite movie</h2>
        <p>
          Rate what you like, keep a watchlist, and get recommendations tailored to your taste.
        </p>
      </section>

      <form className="auth-form card" onSubmit={handleSubmit} noValidate>
        <h2>{isRegister ? 'Create account' : 'Welcome back'}</h2>
        <p className="auth-subtitle">
          {isRegister ? 'Set up your profile to start getting recommendations.' : 'Login to continue where you left off.'}
        </p>

        {isRegister && (
          <label className="field-group">
            <span>Full name</span>
            <input
              placeholder="e.g. Dana Cohen"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              required
            />
            {formErrors.fullName && <small className="field-error">{formErrors.fullName}</small>}
          </label>
        )}

        <label className="field-group">
          <span>Email</span>
          <input
            placeholder="name@example.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          {formErrors.email && <small className="field-error">{formErrors.email}</small>}
        </label>

        <label className="field-group">
          <span>Password</span>
          <input
            placeholder="At least 8 characters"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            required
          />
          <small className="field-hint">Use 8+ chars with uppercase, lowercase, and a number.</small>
          {formErrors.password && <small className="field-error">{formErrors.password}</small>}
        </label>

        <div className="auth-actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait...' : isRegister ? 'Create account' : 'Login'}
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => {
              setIsRegister((prev) => !prev)
              setError(null)
              setFormErrors({})
            }}
          >
            {isRegister ? 'Already have an account?' : 'Create account'}
          </button>
        </div>

        {error && <p className="alert-error">{error}</p>}
      </form>
    </div>
  )
}
