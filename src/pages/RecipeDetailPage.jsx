import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import Spinner from '../components/Spinner'
import {
  ArrowLeftIcon,
  ChefHatIcon,
  ClockIcon,
  EditIcon,
  TrashIcon,
  UsersIcon,
} from '../components/Icons'
import { useAuth } from '../context/AuthContext'
import { deleteRecipe, fetchRecipeById } from '../services/recipeService'
import { friendlyError } from '../utils/errors'
import {
  formatDate,
  formatMinutes,
  getInitials,
  timeAgo,
  totalMinutes,
} from '../utils/format'

export default function RecipeDetailPage() {
  const { id } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [checkedIngredients, setCheckedIngredients] = useState(() => new Set())
  const [flash, setFlash] = useState(location.state?.flash || '')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setCheckedIngredients(new Set())

    fetchRecipeById(id)
      .then((result) => {
        if (!active) return
        setRecipe(result)
        if (!result) setError('Recipe not found.')
      })
      .catch((loadError) => {
        if (!active) return
        setError(friendlyError(loadError, 'We could not load this recipe.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [id])

  function toggleIngredient(index) {
    setCheckedIngredients((current) => {
      const next = new Set(current)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  async function handleDelete() {
    if (!recipe || !profile) return
    const confirmed = window.confirm(
      `Delete "${recipe.title}"? This cannot be undone.`,
    )
    if (!confirmed) return

    setDeleting(true)
    setError('')
    try {
      await deleteRecipe(recipe.id, profile)
      navigate(profile.role === 'admin' ? '/admin' : '/my-recipes', {
        replace: true,
        state: { flash: 'Recipe deleted.' },
      })
    } catch (deleteError) {
      setError(friendlyError(deleteError, 'We could not delete this recipe.'))
      setDeleting(false)
    }
  }

  if (loading) return <Spinner label="Loading recipe…" />

  if (!recipe) {
    return (
      <div className="container page">
        <EmptyState
          icon={<ChefHatIcon size={30} />}
          title={error || 'Recipe not found'}
          message="It may have been removed, or the link may be incorrect."
          action={
            <Link to="/" className="btn btn-primary">
              Browse recipes
            </Link>
          }
        />
      </div>
    )
  }

  const canManage =
    profile && (profile.role === 'admin' || profile.uid === recipe.authorId)

  return (
    <div className="container page detail-page">
      <Link to="/" className="back-link">
        <ArrowLeftIcon size={16} />
        Back to recipes
      </Link>

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

      <article className="recipe-detail">
        <div className="detail-hero">
          <div className="detail-media">
            {recipe.imageUrl ? (
              <img src={recipe.imageUrl} alt={recipe.title} />
            ) : (
              <div className="image-fallback image-fallback-lg">
                <ChefHatIcon size={48} />
                <span>No photo yet</span>
              </div>
            )}
            <div className="detail-media-badges">
              <span className="badge badge-category">{recipe.category}</span>
              <span className={`badge badge-difficulty difficulty-${recipe.difficulty?.toLowerCase()}`}>
                {recipe.difficulty}
              </span>
            </div>
          </div>

          <div className="detail-head">
            <span className="eyebrow">A recipe by {recipe.authorName}</span>
            <h1>{recipe.title}</h1>
            <p className="detail-description">{recipe.description}</p>

            <div className="detail-meta-grid">
              <div className="meta-card">
                <ClockIcon size={18} />
                <span>Prep</span>
                <strong>{formatMinutes(recipe.prepTime)}</strong>
              </div>
              <div className="meta-card">
                <ClockIcon size={18} />
                <span>Cook</span>
                <strong>{formatMinutes(recipe.cookTime)}</strong>
              </div>
              <div className="meta-card meta-card-accent">
                <ClockIcon size={18} />
                <span>Total</span>
                <strong>{formatMinutes(totalMinutes(recipe))}</strong>
              </div>
              <div className="meta-card">
                <UsersIcon size={18} />
                <span>Serves</span>
                <strong>{recipe.servings}</strong>
              </div>
            </div>

            <div className="detail-footer">
              <div className="detail-author">
                <span className="avatar">{getInitials(recipe.authorName)}</span>
                <span>
                  <strong>{recipe.authorName}</strong>
                  <small>
                    Published {formatDate(recipe.createdAt)} · {timeAgo(recipe.createdAt)}
                  </small>
                </span>
              </div>

              {canManage ? (
                <div className="detail-actions">
                  <Link to={`/recipes/${recipe.id}/edit`} className="btn btn-secondary btn-sm">
                    <EditIcon size={16} />
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="btn btn-danger-ghost btn-sm"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    <TrashIcon size={16} />
                    {deleting ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="detail-body">
          <aside className="panel ingredients-panel">
            <div className="panel-head">
              <h2>Ingredients</h2>
              <span className="pill">Serves {recipe.servings}</span>
            </div>
            <ul className="check-list">
              {recipe.ingredients.map((ingredient, index) => {
                const checked = checkedIngredients.has(index)
                return (
                  <li key={`${ingredient}-${index}`}>
                    <label className={`check-item${checked ? ' checked' : ''}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleIngredient(index)}
                      />
                      <span className="check-box" aria-hidden="true" />
                      <span>{ingredient}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
            <p className="panel-note">Tick ingredients off as you prep.</p>
          </aside>

          <section className="panel steps-panel">
            <div className="panel-head">
              <h2>Method</h2>
              <span className="pill">{recipe.steps.length} steps</span>
            </div>
            <ol className="steps-list">
              {recipe.steps.map((step, index) => (
                <li key={`${step.slice(0, 20)}-${index}`}>
                  <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </article>
    </div>
  )
}
