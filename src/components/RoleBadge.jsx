import { ROLE_LABELS } from '../constants'

export default function RoleBadge({ role }) {
  const safeRole = role || 'viewer'
  return (
    <span className={`badge role-badge role-${safeRole}`}>
      {ROLE_LABELS[safeRole] || 'Viewer'}
    </span>
  )
}
