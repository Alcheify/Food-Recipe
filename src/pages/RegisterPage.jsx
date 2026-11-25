import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import { BookOpenIcon, ChefHatIcon } from '../components/Icons'
import { useAuth } from '../context/AuthContext'
import { friendlyError } from '../utils/errors'

export default function RegisterPage() {
  const { profile, loading, register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('viewer')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && profile) return <Navigate to="/" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (name.trim().length < 2) {
      setError('Please enter your name.')
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Please enter a valid email address.')
      return
    }
    if (password.length < 6) {
      setError('Your password needs at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Those passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await register({ name, email, password, role })
      navigate('/', { replace: true })
    } catch (registerError) {
      setError(friendlyError(registerError, 'We could not create your account. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Join the table"
      title="Create your account"
      subtitle="Create an account to browse every recipe, or start sharing your own from day one."
    >
      <form className="form" onSubmit={handleSubmit} noValidate>
        {error ? (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        ) : null}

        <label className="field">
          <span className="field-label">Your name</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Maya Rivera"
            autoComplete="name"
            required
          />
        </label>

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

        <div className="form-grid two">
          <label className="field">
            <span className="field-label">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Confirm password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat password"
              autoComplete="new-password"
              required
            />
          </label>
        </div>

        <fieldset className="role-field">
          <legend className="field-label">How will you use RecipeHub?</legend>
          <div className="role-options">
            <label className={`role-option${role === 'viewer' ? ' selected' : ''}`}>
              <input
                type="radio"
                name="role"
                value="viewer"
                checked={role === 'viewer'}
                onChange={() => setRole('viewer')}
              />
              <span className="role-option-icon">
                <BookOpenIcon size={20} />
              </span>
              <span className="role-option-copy">
                <strong>Viewer</strong>
                <span>Browse recipes and discover new favorites.</span>
              </span>
            </label>

            <label className={`role-option${role === 'creator' ? ' selected' : ''}`}>
              <input
                type="radio"
                name="role"
                value="creator"
                checked={role === 'creator'}
                onChange={() => setRole('creator')}
              />
              <span className="role-option-icon">
                <ChefHatIcon size={20} />
              </span>
              <span className="role-option-copy">
                <strong>Recipe Creator</strong>
                <span>Publish recipes and upload food photos.</span>
              </span>
            </label>
          </div>
          <p className="field-hint">Admin accounts are assigned by an existing administrator.</p>
        </fieldset>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Creating your account…' : 'Create account'}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthShell>
  )
}
