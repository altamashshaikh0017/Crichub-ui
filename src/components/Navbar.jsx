import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import './Navbar.css'

const LINKS = [
  { href: '/#features', label: 'What it does' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#formats', label: 'Formats' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const close = () => setMenuOpen(false)

  return (
    <header className="nav">
      <div className="container nav__inner">
        <Link to="/" className="nav__brand" onClick={close}>
          <span className="nav__seam" aria-hidden="true" />
          <span className="nav__wordmark">
            Cric<span>Hub</span>
          </span>
        </Link>

        <nav className={`nav__links ${menuOpen ? 'is-open' : ''}`} aria-label="Primary">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={close}>
              {link.label}
            </a>
          ))}

          <div className="nav__actions">
            <NavLink to="/login" className="btn btn--outline btn--sm" onClick={close}>
              Log in
            </NavLink>
            <NavLink to="/signup" className="btn btn--primary btn--sm" onClick={close}>
              Sign up
            </NavLink>
          </div>
        </nav>

        <button
          type="button"
          className="nav__toggle"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className={menuOpen ? 'is-x' : ''} />
        </button>
      </div>
    </header>
  )
}
