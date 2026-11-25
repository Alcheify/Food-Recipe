import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import { useAuth } from '../context/AuthContext'
import { isDemoMode } from '../firebase'
import { friendlyError } from '../utils/errors'

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@demo.com', password: 'Admin123!' },
  { role: 'Recipe Creator', email: 'creator@demo.com', password: 'Creator123!' },
  { role: 'Viewer', email: 'viewer@demo.com', password: 'Viewer123!' },
]

export default function LoginPage() {
  const { profile, loading, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && profile) return <Navigate to="/" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Enter your email and password to continue.')
      return
    }

    setSubmitting(true)
    try {
      await login({ email, password })
      const target =
        location.state?.from && location.state.from.startsWith('/') ? location.state.from : '/'
      navigate(target, { replace: true })
    } catch (loginError) {
      setError(friendlyError(loginError, 'We could not sign you in. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  function fillDemoAccount(account) {
    setEmail(account.email)
    setPassword(account.password)
    setError('')
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Log in to RecipeHub"
      subtitle="Pick up where you left off and get cooking."
    >
      {isDemoMode ? (
        <div className="demo-note">
          <strong>Preview mode</strong>
          <span>
            Firebase is not connected yet. Sign in with a demo account or create a new one —
            everything stays in this browser.
          </span>
        </div>
      ) : null}

      <form className="form" onSubmit={handleSubmit} noValidate>
        {error ? (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        ) : null}

        <label className="field">
          <span className="field-label">Email address</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>

        <div className="field">
          <label className="field-label" htmlFor="login-password">
            Password
          </label>
          <div className="password-field">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Log in'}
        </button>
      </form>

      {isDemoMode ? (
        <div className="demo-accounts">
          <p>Or fill a demo account</p>
          <div className="demo-account-grid">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                className="demo-account"
                onClick={() => fillDemoAccount(account)}
              >
                <strong>{account.role}</strong>
                <span>{account.email}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <p className="auth-switch">
        New to RecipeHub? <Link to="/register">Create an account</Link>
      </p>
    </AuthShell>
  )
}
