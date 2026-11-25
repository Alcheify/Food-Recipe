import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isDemoMode } from '../firebase'
import { LogoMark } from './Icons'

export default function Footer() {
  const { profile } = useAuth()

  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <span className="brand-mark brand-mark-sm">
            <LogoMark size={28} />
          </span>
          <div>
            <strong>RecipeHub</strong>
            <span>Cook something worth sharing.</span>
          </div>
        </div>

        <nav className="footer-links" aria-label="Footer">
          {profile ? (
            <Link to="/">Browse</Link>
          ) : (
            <>
              <Link to="/register">Join the table</Link>
              <Link to="/login">Log in</Link>
            </>
          )}
        </nav>

        <p className="footer-copy">
          © {new Date().getFullYear()} RecipeHub
          {isDemoMode ? ' · Local preview mode' : ' · Built with React & Firebase'}
        </p>
      </div>
    </footer>
  )
}
