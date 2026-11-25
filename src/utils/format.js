export function getInitials(name = '') {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || '?'
  )
}

export function formatMinutes(minutes) {
  const value = Math.max(0, Number(minutes) || 0)
  if (value < 60) return `${value} min`
  const hours = Math.floor(value / 60)
  const rest = value % 60
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`
}

export function totalMinutes(recipe) {
  return (Number(recipe?.prepTime) || 0) + (Number(recipe?.cookTime) || 0)
}

export function timeAgo(value) {
  if (!value) return 'Recently'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently'

  const diff = Date.now() - date.getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return 'Just now'
  if (diff < hour) return `${Math.floor(diff / minute)} min ago`
  if (diff < day) return `${Math.floor(diff / hour)} hr ago`
  if (diff < day * 7) {
    const days = Math.floor(diff / day)
    return `${days} day${days === 1 ? '' : 's'} ago`
  }
  if (diff < day * 30) {
    const weeks = Math.floor(diff / (day * 7))
    return `${weeks} wk${weeks === 1 ? '' : 's'} ago`
  }
  if (diff < day * 365) {
    const months = Math.floor(diff / (day * 30))
    return `${months} mo${months === 1 ? '' : 's'} ago`
  }
  return formatDate(value)
}

export function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function newId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}
