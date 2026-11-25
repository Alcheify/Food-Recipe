import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import Spinner from '../components/Spinner'
import { ChefHatIcon, ClockIcon, EditIcon, PlusIcon, TrashIcon } from '../components/Icons'
import { useAuth } from '../context/AuthContext'
import { deleteRecipe, fetchRecipesByAuthor } from '../services/recipeService'
import { friendlyError } from '../utils/errors'
import {
  formatMinutes,
  getInitials,
  timeAgo,
  totalMinutes,
} from '../utils/format'

export default function MyRecipesPage() {
  const { profile } = useAuth()
  const location = useLocation()

  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const [flash, setFlash] = useState(location.state?.flash || '')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    if (!profile?.uid) {
      setLoading(false)
      return undefined
    }

    fetchRecipesByAuthor(profile.uid)
      .then((result) => {
        if (active) setRecipes(result)
      })
      .catch((loadError) => {
        if (active) setError(friendlyError(loadError, 'We could not load your recipes.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [profile?.uid])

  const categories = useMemo(
    () => new Set(recipes.map((recipe) => recipe.category)).size,
    [recipes],
  )

  const totalCookTime = useMemo(
    () => recipes.reduce((sum, recipe) => sum + totalMinutes(recipe), 0),
    [recipes],
  )

  async function handleDelete(recipe) {
    const confirmed = window.confirm(`Delete "${recipe.title}"? This cannot be undone.`)
    if (!confirmed) return

    setDeletingId(recipe.id)
    setError('')
    try {
      await deleteRecipe(recipe.id, profile)
      setRecipes((current) => current.filter((item) => item.id !== recipe.id))
      setFlash('Recipe deleted.')
    } catch (deleteError) {
      setError(friendlyError(deleteError, 'We could not delete that recipe.'))
    } finally {
      setDeletingId('')
    }
  }

  return (
    <div className="container page">
      <div className="page-head page-head-row">
        <div>
          <span className="eyebrow">Creator studio</span>
          <h1>My recipes</h1>
          <p>
            Manage everything you have shared, or add something new to the table.
          </p>
        </div>
        <Link to="/recipes/new" className="btn btn-primary">
          <PlusIcon size={17} />
          New recipe
        </Link>
      </div>

      {flash ? (
        <div className="alert alert-success alert-with-action" role="status">
          <span>{flash}</span>
          <button
            type="button"
            className="text-button"
            onClick={() => setFlash('')}
            aria-label="Dismiss message"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      ) : null}

      <div className="mini-stats">
        <div className="mini-stat">
          <span>Published recipes</span>
          <strong>{recipes.length}</strong>
        </div>
        <div className="mini-stat">
          <span>Categories used</span>
          <strong>{categories}</strong>
        </div>
        <div className="mini-stat">
          <span>Total cook time</span>
          <strong>{formatMinutes(totalCookTime)}</strong>
        </div>
      </div>

      {loading ? (
        <Spinner label="Loading your recipes…" />
      ) : recipes.length === 0 ? (
        <EmptyState
          icon={<ChefHatIcon size={30} />}
          title="Your recipe box is waiting"
          message="Share your first recipe and it will show up here, ready to edit whenever inspiration strikes."
          action={
            <Link to="/recipes/new" className="btn btn-primary">
              <PlusIcon size={16} />
              Create your first recipe
            </Link>
          }
        />
      ) : (
        <div className="manage-list">
          {recipes.map((recipe) => (
            <article className="manage-row" key={recipe.id}>
              <Link to={`/recipes/${recipe.id}`} className="manage-thumb">
                {recipe.imageUrl ? (
                  <img src={recipe.imageUrl} alt={recipe.title} loading="lazy" />
                ) : (
                  <span className="image-fallback">
                    <ChefHatIcon size={26} />
                  </span>
                )}
              </Link>

              <div className="manage-info">
                <div className="manage-title-row">
                  <Link to={`/recipes/${recipe.id}`}>{recipe.title}</Link>
                  <span className="badge badge-category">{recipe.category}</span>
                </div>
                <p className="manage-meta">
                  <span className="meta-item">
                    <ClockIcon size={14} />
                    {formatMinutes(totalMinutes(recipe))}
                  </span>
                  <span className="meta-item">Serves {recipe.servings}</span>
                  <span className="meta-item">
                    <span className="avatar avatar-xs">{getInitials(recipe.authorName)}</span>
                    {recipe.authorName}
                  </span>
                  <span className="meta-item">
                    Updated {timeAgo(recipe.updatedAt || recipe.createdAt)}
                  </span>
                </p>
              </div>

              <div className="manage-actions">
                <Link
                  to={`/recipes/${recipe.id}/edit`}
                  className="btn btn-secondary btn-sm"
                >
                  <EditIcon size={15} />
                  Edit
                </Link>
                <button
                  type="button"
                  className="btn btn-danger-ghost btn-sm"
                  onClick={() => handleDelete(recipe)}
                  disabled={deletingId === recipe.id}
                >
                  <TrashIcon size={15} />
                  {deletingId === recipe.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
