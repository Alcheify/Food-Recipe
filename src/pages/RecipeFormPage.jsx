import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import ImageUpload from '../components/ImageUpload'
import Spinner from '../components/Spinner'
import { ArrowLeftIcon, ChefHatIcon, CloseIcon, PlusIcon } from '../components/Icons'
import { CATEGORIES, DIFFICULTIES } from '../constants'
import { useAuth } from '../context/AuthContext'
import { createRecipe, fetchRecipeById, updateRecipe } from '../services/recipeService'
import { friendlyError } from '../utils/errors'
import { formatMinutes, newId } from '../utils/format'

const makeRow = (value = '') => ({ id: newId(), value })

function makeEmptyValues() {
  return {
    title: '',
    description: '',
    category: 'Dinner',
    prepTime: '',
    cookTime: '',
    servings: '4',
    difficulty: 'Easy',
    ingredients: [makeRow(), makeRow(), makeRow()],
    steps: [makeRow(), makeRow(), makeRow()],
  }
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_SIZE = 10 * 1024 * 1024

export default function RecipeFormPage() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [values, setValues] = useState(makeEmptyValues)
  const [imageFile, setImageFile] = useState(null)
  const [existingImageUrl, setExistingImageUrl] = useState('')
  const [loadingRecipe, setLoadingRecipe] = useState(isEditing)
  const [loadFailed, setLoadFailed] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isEditing) {
      setValues(makeEmptyValues())
      setImageFile(null)
      setExistingImageUrl('')
      setLoadingRecipe(false)
      setLoadFailed(false)
      setError('')
      return undefined
    }

    let active = true
    setLoadingRecipe(true)
    setLoadFailed(false)
    setError('')

    fetchRecipeById(id)
      .then((recipe) => {
        if (!active) return

        if (!recipe) {
          setLoadFailed(true)
          setLoadingRecipe(false)
          return
        }

        const allowed =
          profile && (profile.role === 'admin' || profile.uid === recipe.authorId)
        if (!allowed) {
          navigate('/forbidden', { replace: true })
          return
        }

        setValues({
          title: recipe.title,
          description: recipe.description,
          category: recipe.category,
          prepTime: String(recipe.prepTime ?? ''),
          cookTime: String(recipe.cookTime ?? ''),
          servings: String(recipe.servings ?? 4),
          difficulty: recipe.difficulty,
          ingredients: recipe.ingredients.length
            ? recipe.ingredients.map((item) => makeRow(item))
            : [makeRow(), makeRow()],
          steps: recipe.steps.length
            ? recipe.steps.map((item) => makeRow(item))
            : [makeRow(), makeRow()],
        })
        setExistingImageUrl(recipe.imageUrl || '')
        setLoadingRecipe(false)
      })
      .catch((loadError) => {
        if (!active) return
        setError(friendlyError(loadError, 'We could not load this recipe.'))
        setLoadFailed(true)
        setLoadingRecipe(false)
      })

    return () => {
      active = false
    }
  }, [id, isEditing, navigate, profile?.uid, profile?.role])

  function updateField(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function updateRow(field, rowId, value) {
    setValues((current) => ({
      ...current,
      [field]: current[field].map((row) => (row.id === rowId ? { ...row, value } : row)),
    }))
  }

  function addRow(field) {
    setValues((current) => ({ ...current, [field]: [...current[field], makeRow()] }))
  }

  function removeRow(field, rowId) {
    setValues((current) => ({
      ...current,
      [field]:
        current[field].length > 1
          ? current[field].filter((row) => row.id !== rowId)
          : current[field],
    }))
  }

  function handleImageChange(file) {
    setError('')
    if (!file) {
      setImageFile(null)
      return
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('Please choose a JPG, PNG, or WebP image.')
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError('That image is too large. Please choose a file under 10 MB.')
      return
    }
    setImageFile(file)
  }

  function showError(message) {
    setError(message)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function validate() {
    if (values.title.trim().length < 3) {
      return 'Give your recipe a title of at least 3 characters.'
    }
    if (values.description.trim().length < 20) {
      return 'Write a short description of at least 20 characters.'
    }

    const prepTime = Number(values.prepTime || 0)
    const cookTime = Number(values.cookTime || 0)
    const servings = Number(values.servings)

    if (
      !Number.isInteger(prepTime) ||
      prepTime < 0 ||
      !Number.isInteger(cookTime) ||
      cookTime < 0
    ) {
      return 'Prep and cook times must be whole, positive minutes.'
    }
    if (!Number.isInteger(servings) || servings < 1) {
      return 'Servings must be a whole number of at least 1.'
    }

    const ingredients = values.ingredients
      .map((row) => row.value.trim())
      .filter(Boolean)
    if (ingredients.length < 2) {
      return 'Add at least two ingredients.'
    }

    const steps = values.steps.map((row) => row.value.trim()).filter(Boolean)
    if (steps.length < 2) {
      return 'Add at least two method steps.'
    }

    return ''
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const validationMessage = validate()
    if (validationMessage) {
      showError(validationMessage)
      return
    }

    const payload = {
      title: values.title.trim(),
      description: values.description.trim(),
      category: values.category,
      prepTime: Number(values.prepTime || 0),
      cookTime: Number(values.cookTime || 0),
      servings: Number(values.servings),
      difficulty: values.difficulty,
      ingredients: values.ingredients.map((row) => row.value.trim()).filter(Boolean),
      steps: values.steps.map((row) => row.value.trim()).filter(Boolean),
    }

    setSaving(true)
    try {
      if (isEditing) {
        await updateRecipe(id, payload, imageFile, profile)
        navigate(`/recipes/${id}`, {
          replace: true,
          state: { flash: 'Recipe updated.' },
        })
      } else {
        const recipeId = await createRecipe(payload, imageFile, profile)
        navigate(`/recipes/${recipeId}`, {
          replace: true,
          state: { flash: 'Your recipe is live. Happy cooking!' },
        })
      }
    } catch (saveError) {
      setSaving(false)
      showError(friendlyError(saveError, 'We could not save your recipe.'))
    }
  }

  const cancelTo = isEditing ? `/recipes/${id}` : '/my-recipes'
  const totalTime = (Number(values.prepTime) || 0) + (Number(values.cookTime) || 0)

  if (loadingRecipe) return <Spinner label="Loading your recipe…" />

  if (loadFailed) {
    return (
      <div className="container page">
        <EmptyState
          icon={<ChefHatIcon size={30} />}
          title="We could not open that recipe"
          message={error || 'The recipe may have been removed.'}
          action={
            <Link to="/my-recipes" className="btn btn-primary">
              Back to my recipes
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="container page form-page">
      <Link to={cancelTo} className="back-link">
        <ArrowLeftIcon size={16} />
        {isEditing ? 'Back to recipe' : 'Back to my recipes'}
      </Link>

      <div className="page-head">
        <div>
          <span className="eyebrow">{isEditing ? 'Edit recipe' : 'New recipe'}</span>
          <h1>{isEditing ? 'Fine-tune your recipe' : 'Share something delicious'}</h1>
          <p>
            {isEditing
              ? 'Update the details below, then save your changes.'
              : 'Good recipes are clear recipes. Add the details you would want if you were cooking this for the first time.'}
          </p>
        </div>
      </div>

      {error ? (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      ) : null}

      <form className="recipe-form" onSubmit={handleSubmit} noValidate>
        <div className="form-layout">
          <div className="form-main">
            <section className="panel form-section">
              <div className="section-title-row">
                <h2>The basics</h2>
                <span className="section-step">01</span>
              </div>

              <label className="field">
                <span className="field-label">Recipe title</span>
                <input
                  type="text"
                  value={values.title}
                  onChange={(event) => updateField('title', event.target.value)}
                  placeholder="e.g. Creamy Tuscan Salmon"
                  maxLength={100}
                  required
                />
              </label>

              <label className="field">
                <span className="field-label">Short description</span>
                <textarea
                  rows={4}
                  value={values.description}
                  onChange={(event) => updateField('description', event.target.value)}
                  placeholder="What makes this recipe special? Mention the flavor, texture, or occasion."
                  maxLength={500}
                  required
                />
                <span className="field-hint">{values.description.length}/500 characters</span>
              </label>

              <div className="form-grid two">
                <label className="field">
                  <span className="field-label">Category</span>
                  <select
                    value={values.category}
                    onChange={(event) => updateField('category', event.target.value)}
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span className="field-label">Difficulty</span>
                  <select
                    value={values.difficulty}
                    onChange={(event) => updateField('difficulty', event.target.value)}
                  >
                    {DIFFICULTIES.map((difficulty) => (
                      <option key={difficulty} value={difficulty}>
                        {difficulty}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="panel form-section">
              <div className="section-title-row">
                <h2>Timing &amp; servings</h2>
                <span className="section-step">02</span>
              </div>

              <div className="form-grid three">
                <label className="field">
                  <span className="field-label">Prep time (minutes)</span>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    inputMode="numeric"
                    value={values.prepTime}
                    onChange={(event) => updateField('prepTime', event.target.value)}
                    placeholder="15"
                  />
                </label>

                <label className="field">
                  <span className="field-label">Cook time (minutes)</span>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    inputMode="numeric"
                    value={values.cookTime}
                    onChange={(event) => updateField('cookTime', event.target.value)}
                    placeholder="30"
                  />
                </label>

                <label className="field">
                  <span className="field-label">Servings</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={values.servings}
                    onChange={(event) => updateField('servings', event.target.value)}
                    required
                  />
                </label>
              </div>
            </section>

            <section className="panel form-section">
              <div className="section-title-row">
                <h2>Ingredients</h2>
                <span className="section-step">03</span>
              </div>
              <p className="section-lead">
                Include the amount and the ingredient, like &ldquo;2 cups all-purpose
                flour&rdquo;.
              </p>

              <div className="dynamic-list">
                {values.ingredients.map((row, index) => (
                  <div className="dynamic-row" key={row.id}>
                    <span className="dynamic-index">{index + 1}</span>
                    <input
                      type="text"
                      value={row.value}
                      onChange={(event) => updateRow('ingredients', row.id, event.target.value)}
                      placeholder="e.g. 2 cups all-purpose flour"
                      aria-label={`Ingredient ${index + 1}`}
                    />
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => removeRow('ingredients', row.id)}
                      disabled={values.ingredients.length === 1}
                      aria-label={`Remove ingredient ${index + 1}`}
                    >
                      <CloseIcon size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="add-row-button"
                onClick={() => addRow('ingredients')}
              >
                <PlusIcon size={16} />
                Add ingredient
              </button>
            </section>

            <section className="panel form-section">
              <div className="section-title-row">
                <h2>Method</h2>
                <span className="section-step">04</span>
              </div>
              <p className="section-lead">
                Break the recipe into clear steps. One action per step works best.
              </p>

              <div className="dynamic-list">
                {values.steps.map((row, index) => (
                  <div className="dynamic-row dynamic-row-step" key={row.id}>
                    <span className="dynamic-index">{String(index + 1).padStart(2, '0')}</span>
                    <textarea
                      rows={2}
                      value={row.value}
                      onChange={(event) => updateRow('steps', row.id, event.target.value)}
                      placeholder="Describe this step…"
                      aria-label={`Step ${index + 1}`}
                    />
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => removeRow('steps', row.id)}
                      disabled={values.steps.length === 1}
                      aria-label={`Remove step ${index + 1}`}
                    >
                      <CloseIcon size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <button type="button" className="add-row-button" onClick={() => addRow('steps')}>
                <PlusIcon size={16} />
                Add step
              </button>
            </section>
          </div>

          <aside className="form-side">
            <section className="panel form-section">
              <h2>Food photo</h2>
              <p className="section-lead">
                A bright, close-up photo helps people choose your recipe.
              </p>
              <ImageUpload
                file={imageFile}
                onChange={handleImageChange}
                existingUrl={existingImageUrl}
              />
            </section>

            <section className="panel form-section publish-card">
              <h2>{isEditing ? 'Ready to save?' : 'Ready to share?'}</h2>
              <div className="publish-summary">
                <div>
                  <span>Total time</span>
                  <strong>{formatMinutes(totalTime)}</strong>
                </div>
                <div>
                  <span>Servings</span>
                  <strong>{values.servings || '—'}</strong>
                </div>
                <div>
                  <span>Ingredients</span>
                  <strong>
                    {values.ingredients.filter((row) => row.value.trim()).length}
                  </strong>
                </div>
                <div>
                  <span>Steps</span>
                  <strong>{values.steps.filter((row) => row.value.trim()).length}</strong>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={saving}
              >
                {saving
                  ? isEditing
                    ? 'Saving changes…'
                    : 'Publishing…'
                  : isEditing
                    ? 'Save changes'
                    : 'Publish recipe'}
              </button>
              <Link to={cancelTo} className="btn btn-ghost btn-block">
                Cancel
              </Link>
              <p className="field-hint">
                Your recipe is visible to everyone as soon as you publish.
              </p>
            </section>
          </aside>
        </div>
      </form>
    </div>
  )
}
