import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import RecipeCard from '../components/RecipeCard'
import Spinner from '../components/Spinner'
import {
  ChefHatIcon,
  ClockIcon,
  PlusIcon,
  SearchIcon,
  UsersIcon,
} from '../components/Icons'
import { CATEGORIES } from '../constants'
import { useAuth } from '../context/AuthContext'
import { fetchRecipes } from '../services/recipeService'
import { friendlyError } from '../utils/errors'
import { getInitials } from '../utils/format'

export default function BrowsePage() {
  const { profile, canCreate } = useAuth()
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  async function loadRecipes() {
    setLoading(true)
    setError('')
    try {
      setRecipes(await fetchRecipes())
    } catch (loadError) {
      setError(friendlyError(loadError, 'We could not load recipes right now.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRecipes()
  }, [])

  const filteredRecipes = useMemo(() => {
    const term = search.trim().toLowerCase()
    return recipes.filter((recipe) => {
      if (category !== 'All' && recipe.category !== category) return false
      if (!term) return true
      const haystack = [
        recipe.title,
        recipe.description,
        recipe.category,
        recipe.authorName,
        ...(recipe.ingredients || []),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [recipes, search, category])

  const authors = useMemo(() => {
    const unique = new Map()
    for (const recipe of recipes) {
      if (!unique.has(recipe.authorId)) unique.set(recipe.authorId, recipe.authorName)
    }
    return Array.from(unique.values())
  }, [recipes])

  const hasFilters = search.trim() || category !== 'All'

  function clearFilters() {
    setSearch('')
    setCategory('All')
  }

  return (
    <div className="browse-page">
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              A recipe community for every table
            </span>
            <h1>
              Cook something
              <br />
              <em>worth sharing.</em>
            </h1>
            <p className="hero-lead">
              Discover tried-and-true recipes from home cooks, save the ones you love, and
              share the dishes that always disappear first.
            </p>

            <div className="hero-actions">
              {canCreate ? (
                <Link to="/recipes/new" className="btn btn-primary">
                  <PlusIcon size={18} />
                  Share a recipe
                </Link>
              ) : null}
              {!profile ? (
                <Link to="/register" className="btn btn-primary">
                  Join the table
                </Link>
              ) : null}
              <a
                href="#recipe-library"
                className={`btn ${
                  canCreate || !profile ? 'btn-secondary' : 'btn-primary'
                }`}
              >
                Explore recipes
              </a>
            </div>

            <div className="hero-proof">
              <div className="avatar-stack" aria-hidden="true">
                {(authors.length ? authors.slice(0, 3) : ['Maya Rivera', 'Ava Bennett', 'Sam Lee']).map(
                  (name, index) => (
                    <span className="avatar avatar-sm" key={`${name}-${index}`}>
                      {getInitials(name)}
                    </span>
                  ),
                )}
              </div>
              <p>
                {recipes.length > 0
                  ? `${recipes.length} recipes from ${authors.length} home cook${
                      authors.length === 1 ? '' : 's'
                    }`
                  : 'A growing table of home cooks'}
              </p>
            </div>
          </div>

          <div className="hero-art" aria-hidden="true">
            <span className="hero-blob" />
            <div className="hero-plate">
              <div className="hero-plate-inner">
                <span className="hero-food hero-food-a" />
                <span className="hero-food hero-food-b" />
                <span className="hero-food hero-food-c" />
                <span className="hero-garnish hero-garnish-a" />
                <span className="hero-garnish hero-garnish-b" />
                <span className="hero-garnish hero-garnish-c" />
              </div>
            </div>
            <div className="hero-float hero-float-a">
              <span className="hero-float-icon">
                <ChefHatIcon size={20} />
              </span>
              <span>
                <strong>Made by home cooks</strong>
                <small>Real recipes, real tables</small>
              </span>
            </div>
            <div className="hero-float hero-float-b">
              <span className="hero-float-icon hero-float-icon-warm">
                <ClockIcon size={20} />
              </span>
              <span>
                <strong>Weeknight friendly</strong>
                <small>Filter by the time you have</small>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="library container" id="recipe-library">
        <div className="library-head">
          <div>
            <span className="eyebrow">The recipe library</span>
            <h2>Find your next favorite.</h2>
          </div>
          <p>
            Search by dish, ingredient, or cook. Every recipe includes a full ingredient list
            and step-by-step method.
          </p>
        </div>

        <div className="browse-toolbar">
          <label className="search-field">
            <SearchIcon size={19} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search recipes, ingredients, or cooks…"
              aria-label="Search recipes"
            />
          </label>

          <div className="category-chips" role="group" aria-label="Filter by category">
            {['All', ...CATEGORIES].map((item) => (
              <button
                key={item}
                type="button"
                className={`chip${category === item ? ' active' : ''}`}
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="results-bar">
          <p>
            {loading
              ? 'Gathering recipes…'
              : `${filteredRecipes.length} recipe${
                  filteredRecipes.length === 1 ? '' : 's'
                }${hasFilters ? ' match your filters' : ' in the library'}`}
          </p>
          {hasFilters ? (
            <button type="button" className="text-button" onClick={clearFilters}>
              Clear filters
            </button>
          ) : null}
        </div>

        {error ? (
          <div className="alert alert-error alert-with-action" role="alert">
            <span>{error}</span>
            <button type="button" className="btn btn-sm btn-secondary" onClick={loadRecipes}>
              Try again
            </button>
          </div>
        ) : null}

        {loading ? (
          <Spinner label="Loading recipes…" />
        ) : filteredRecipes.length > 0 ? (
          <div className="recipe-grid">
            {filteredRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={recipes.length === 0 ? <ChefHatIcon size={30} /> : <SearchIcon size={30} />}
            title={recipes.length === 0 ? 'The table is still empty' : 'No recipes match yet'}
            message={
              recipes.length === 0
                ? canCreate
                  ? 'Be the first to share something delicious with the community.'
                  : 'Recipes will appear here as soon as creators start sharing.'
                : 'Try a different ingredient, dish name, or category.'
            }
            action={
              recipes.length === 0 && canCreate ? (
                <Link to="/recipes/new" className="btn btn-primary">
                  <PlusIcon size={16} />
                  Share the first recipe
                </Link>
              ) : hasFilters ? (
                <button type="button" className="btn btn-secondary" onClick={clearFilters}>
                  Clear filters
                </button>
              ) : null
            }
          />
        )}
      </section>

      <section className="community-strip">
        <div className="container community-strip-inner">
          <div className="community-strip-copy">
            <span className="eyebrow eyebrow-light">Why share?</span>
            <h2>A recipe is better with a story.</h2>
            <p>
              Whether it is a family classic or a five-ingredient experiment, someone at the
              table is looking for exactly what you cook.
            </p>
          </div>
          <div className="community-strip-stats">
            <div>
              <UsersIcon size={20} />
              <strong>{authors.length || '—'}</strong>
              <span>Home cooks</span>
            </div>
            <div>
              <ChefHatIcon size={20} />
              <strong>{recipes.length || '—'}</strong>
              <span>Shared recipes</span>
            </div>
            <div>
              <ClockIcon size={20} />
              <strong>
                {recipes.length
                  ? `${Math.round(
                      recipes.reduce(
                        (total, recipe) =>
                          total + (Number(recipe.prepTime) || 0) + (Number(recipe.cookTime) || 0),
                        0,
                      ) / recipes.length,
                    )}m`
                  : '—'}
              </strong>
              <span>Avg. total time</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
