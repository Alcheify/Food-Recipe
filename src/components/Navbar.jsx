import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getInitials } from '../utils/format'
import RoleBadge from './RoleBadge'
import { CloseIcon, LogoMark, LogOutIcon, MenuIcon, PlusIcon } from './Icons'

export default function Navbar() {
  const { profile, loading, canCreate, isAdmin, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  async function handleLogout() {
    setMenuOpen(false)
    try {
      await logout()
      navigate('/')
    } catch (error) {
      console.error('Logout failed.', error)
    }
  }

  const links = profile ? [{ to: '/', label: 'Browse recipes', end: true }] : []
  if (canCreate) links.push({ to: '/my-recipes', label: 'My recipes' })
  if (isAdmin) links.push({ to: '/admin', label: 'Admin' })

  const navLinks = links.map((link) => (
    <NavLink
      key={link.to}
      to={link.to}
      end={link.end}
      className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
      onClick={() => setMenuOpen(false)}
    >
      {link.label}
    </NavLink>
  ))

  let controls = null
  if (!loading) {
    controls = profile ? (
      <>
        {canCreate ? (
          <Link to="/recipes/new" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)}>
            <PlusIcon size={16} />
            Share a recipe
          </Link>
        ) : null}
        <div className="nav-user">
          <span className="avatar avatar-sm">{getInitials(profile.name)}</span>
          <span className="nav-user-text">
            <span className="nav-user-name">{profile.name}</span>
            <RoleBadge role={profile.role} />
          </span>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
          <LogOutIcon size={16} />
          Log out
        </button>
      </>
    ) : (
      <>
        <Link to="/login" className="btn btn-ghost btn-sm" onClick={() => setMenuOpen(false)}>
          Log in
        </Link>
        <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)}>
          Sign up
        </Link>
      </>
    )
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand" aria-label="RecipeHub home">
          <span className="brand-mark">
            <LogoMark size={36} />
          </span>
          <span className="brand-text">
            Recipe<em>Hub</em>
          </span>
        </Link>

        <nav className="nav-links" aria-label="Primary">
          {navLinks}
        </nav>

        <div className="nav-actions">{controls}</div>

        <button
          type="button"
          className="nav-toggle"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen((current) => !current)}
        >
          {menuOpen ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
        </button>
      </div>

      <div id="mobile-nav" className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        <nav className="mobile-links" aria-label="Mobile navigation">
          {navLinks}
        </nav>
        <div className="mobile-controls">{controls}</div>
      </div>
    </header>
  )
}
