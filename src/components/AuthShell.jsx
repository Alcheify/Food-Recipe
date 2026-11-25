import { Link } from 'react-router-dom'
import { LogoMark } from './Icons'

export default function AuthShell({ eyebrow, title, subtitle, children }) {
  return (
    <div className="auth-page">
      <aside className="auth-side">
        <Link to="/" className="brand auth-brand">
          <span className="brand-mark brand-mark-light">
            <LogoMark size={36} />
          </span>
          <span className="brand-text">
            Recipe<em>Hub</em>
          </span>
        </Link>

        <div className="auth-side-copy">
          <span className="eyebrow eyebrow-light">Recipe sharing, made simple</span>
          <h2>Good food is better shared.</h2>
          <p>
            Save the dishes you love, publish your own signatures, and find inspiration for
            tonight&apos;s dinner.
          </p>
        </div>

        <div className="auth-side-art" aria-hidden="true">
          <span className="auth-plate" />
          <span className="auth-leaf auth-leaf-a" />
          <span className="auth-leaf auth-leaf-b" />
          <span className="auth-speck auth-speck-a" />
          <span className="auth-speck auth-speck-b" />
          <span className="auth-speck auth-speck-c" />
        </div>

        <div className="auth-quote">
          <p>
            &ldquo;I found three new weeknight dinners in ten minutes. The hardest part was
            choosing.&rdquo;
          </p>
          <div className="auth-quote-by">
            <span className="avatar avatar-xs">SL</span>
            <span>Sam L. · Home cook</span>
          </div>
        </div>
      </aside>

      <div className="auth-main">
        <div className="auth-card">
          <div className="auth-card-head">
            <span className="eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
