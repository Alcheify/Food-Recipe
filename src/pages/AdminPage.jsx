import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import Spinner from '../components/Spinner'
import {
  BookOpenIcon,
  ChefHatIcon,
  EditIcon,
  ShieldIcon,
  TrashIcon,
  UsersIcon,
} from '../components/Icons'
import { useAuth } from '../context/AuthContext'
import { deleteRecipe, fetchRecipes } from '../services/recipeService'
import { changeUserRole, fetchAllUsers } from '../services/userService'
import { friendlyError } from '../utils/errors'
import { formatDate, getInitials, timeAgo } from '../utils/format'

export default function AdminPage() {
  const { profile } = useAuth()
  const location = useLocation()

  const [users, setUsers] = useState([])
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(location.state?.flash || '')
  const [savingUid, setSavingUid] = useState('')
  const [deletingId, setDeletingId] = useState('')

  async function loadDashboard() {
    setLoading(true)
    setError('')
    try {
      const [people, allRecipes] = await Promise.all([fetchAllUsers(), fetchRecipes()])
      setUsers(people)
      setRecipes(allRecipes)
    } catch (loadError) {
      setError(friendlyError(loadError, 'We could not load the admin dashboard.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const stats = useMemo(
    () => [
      { label: 'People', value: users.length, icon: <UsersIcon size={19} /> },
      { label: 'Recipes', value: recipes.length, icon: <ChefHatIcon size={19} /> },
      {
        label: 'Recipe creators',
        value: users.filter((user) => user.role === 'creator').length,
        icon: <EditIcon size={19} />,
      },
      {
        label: 'Viewers',
        value: users.filter((user) => user.role === 'viewer').length,
        icon: <BookOpenIcon size={19} />,
      },
    ],
    [users, recipes],
  )

  async function handleRoleChange(uid, role) {
    setSavingUid(uid)
    setError('')
    try {
      await changeUserRole(uid, role)
      setUsers((current) =>
        current.map((user) => (user.uid === uid ? { ...user, role } : user)),
      )
      setNotice('User role updated.')
    } catch (updateError) {
      setError(friendlyError(updateError, 'We could not update that role.'))
    } finally {
      setSavingUid('')
    }
  }

  async function handleDeleteRecipe(recipe) {
    const confirmed = window.confirm(
      `Delete "${recipe.title}" by ${recipe.authorName}? This cannot be undone.`,
    )
    if (!confirmed) return

    setDeletingId(recipe.id)
    setError('')
    try {
      await deleteRecipe(recipe.id, profile)
      setRecipes((current) => current.filter((item) => item.id !== recipe.id))
      setNotice('Recipe deleted.')
    } catch (deleteError) {
      setError(friendlyError(deleteError, 'We could not delete that recipe.'))
    } finally {
      setDeletingId('')
    }
  }

  return (
    <div className="container page admin-page">
      <div className="page-head page-head-row">
        <div>
          <span className="eyebrow">Admin workspace</span>
          <h1>Keep the table running</h1>
          <p>Manage roles and moderate every recipe in the community.</p>
        </div>
        <span className="role-seal">
          <ShieldIcon size={18} />
          Signed in as Admin
        </span>
      </div>

      {notice ? (
        <div className="alert alert-success alert-with-action" role="status">
          <span>{notice}</span>
          <button
            type="button"
            className="text-button"
            onClick={() => setNotice('')}
            aria-label="Dismiss message"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="alert alert-error alert-with-action" role="alert">
          <span>{error}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={loadDashboard}>
            Retry
          </button>
        </div>
      ) : null}

      <div className="stats-grid">
        {stats.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <span className="stat-icon">{stat.icon}</span>
            <span className="stat-value">{stat.value}</span>
            <span className="stat-label">{stat.label}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <Spinner label="Loading the admin dashboard…" />
      ) : (
        <>
          <section className="panel admin-section">
            <div className="panel-head">
              <div>
                <h2>People &amp; roles</h2>
                <p className="panel-subtitle">
                  Promote viewers to recipe creators, or grant admin access.
                </p>
              </div>
              <span className="pill">{users.length} accounts</span>
            </div>

            {users.length === 0 ? (
              <EmptyState title="No accounts found" message="Registered users will appear here." />
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Person</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.uid}>
                        <td>
                          <div className="table-user">
                            <span className="avatar avatar-sm">
                              {getInitials(user.name)}
                            </span>
                            <span>
                              <strong>{user.name}</strong>
                              {user.uid === profile?.uid ? (
                                <span className="you-tag">You</span>
                              ) : null}
                            </span>
                          </div>
                        </td>
                        <td className="table-muted">{user.email}</td>
                        <td>
                          <select
                            className="role-select"
                            value={user.role}
                            disabled={user.uid === profile?.uid || savingUid === user.uid}
                            onChange={(event) => handleRoleChange(user.uid, event.target.value)}
                            aria-label={`Change role for ${user.name}`}
                          >
                            <option value="viewer">Viewer</option>
                            <option value="creator">Recipe Creator</option>
                            <option value="admin">Admin</option>
                          </select>
                          {savingUid === user.uid ? (
                            <span className="row-status">Saving…</span>
                          ) : null}
                        </td>
                        <td className="table-muted">{formatDate(user.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p className="panel-note">
              You cannot change your own role. Firebase Auth accounts can only be removed
              from the Firebase console, not from this dashboard.
            </p>
          </section>

          <section className="panel admin-section">
            <div className="panel-head">
              <div>
                <h2>All recipes</h2>
                <p className="panel-subtitle">Moderate any recipe in the community.</p>
              </div>
              <span className="pill">{recipes.length} recipes</span>
            </div>

            {recipes.length === 0 ? (
              <EmptyState
                icon={<ChefHatIcon size={30} />}
                title="No recipes yet"
                message="Recipes shared by creators will appear here."
              />
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Recipe</th>
                      <th>Author</th>
                      <th>Shared</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {recipes.map((recipe) => (
                      <tr key={recipe.id}>
                        <td>
                          <Link to={`/recipes/${recipe.id}`} className="table-recipe">
                            {recipe.imageUrl ? (
                              <img src={recipe.imageUrl} alt="" loading="lazy" />
                            ) : (
                              <span className="image-fallback image-fallback-xs">
                                <ChefHatIcon size={16} />
                              </span>
                            )}
                            <span>
                              <strong>{recipe.title}</strong>
                              <small>{recipe.category}</small>
                            </span>
                          </Link>
                        </td>
                        <td className="table-muted">{recipe.authorName}</td>
                        <td className="table-muted" title={formatDate(recipe.createdAt)}>
                          {timeAgo(recipe.createdAt)}
                        </td>
                        <td className="table-action">
                          <button
                            type="button"
                            className="btn btn-danger-ghost btn-sm"
                            onClick={() => handleDeleteRecipe(recipe)}
                            disabled={deletingId === recipe.id}
                          >
                            <TrashIcon size={15} />
                            {deletingId === recipe.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
