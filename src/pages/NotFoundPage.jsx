import { Link } from 'react-router-dom'
import { SearchIcon } from '../components/Icons'

export default function NotFoundPage() {
  return (
    <div className="container info-page">
      <span className="info-icon">
        <SearchIcon size={32} />
      </span>
      <span className="eyebrow">404 · Page not found</span>
      <h1>This page is not on the menu.</h1>
      <p>
        The link may be outdated, or the page may have moved. Head back to the recipe
        library and find something good to cook.
      </p>
      <div className="info-actions">
        <Link to="/" className="btn btn-primary">
          Browse recipes
        </Link>
        <Link to="/login" className="btn btn-secondary">
          Log in
        </Link>
      </div>
    </div>
  )
}
