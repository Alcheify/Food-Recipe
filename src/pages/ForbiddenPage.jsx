import { Link } from 'react-router-dom'
import { LockIcon } from '../components/Icons'

export default function ForbiddenPage() {
  return (
    <div className="container info-page">
      <span className="info-icon">
        <LockIcon size={32} />
      </span>
      <span className="eyebrow">403 · Access denied</span>
      <h1>That part of the kitchen is off-limits.</h1>
      <p>
        You are signed in, but your account does not have permission to open this page. If
        you think this is a mistake, ask an administrator to update your role.
      </p>
      <div className="info-actions">
        <Link to="/" className="btn btn-primary">
          Back to recipes
        </Link>
      </div>
    </div>
  )
}
