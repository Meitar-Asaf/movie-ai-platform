import { FormEvent, useState } from 'react'
import { login, register } from '../lib/api'

export default function LoginPage({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      if (isRegister) {
        await register(email, fullName, password)
      }
      const token = await login(email, password)
      onLogin(token)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>{isRegister ? 'Register' : 'Login'}</h2>
      {isRegister && (
        <input
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      )}
      <input
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <div>
        <button type="submit">{isRegister ? 'Create account' : 'Login'}</button>
        <button type="button" onClick={() => setIsRegister((prev) => !prev)}>
          {isRegister ? 'Have account?' : 'Create account'}
        </button>
      </div>
      {error && <p>{error}</p>}
    </form>
  )
}
