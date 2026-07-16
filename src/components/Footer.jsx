import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <span className="footer__wordmark">
            Cric<span>Hub</span>
          </span>
          <p>
            Tournament software for the cricket that actually gets played — local grounds, real
            teams, one contact number each.
          </p>
        </div>

        <nav className="footer__col" aria-label="Product">
          <h3>Product</h3>
          <a href="/#features">What it does</a>
          <a href="/#how-it-works">How it works</a>
          <a href="/#formats">Formats</a>
        </nav>

        <nav className="footer__col" aria-label="Account">
          <h3>Account</h3>
          <Link to="/login">Log in</Link>
          <Link to="/signup">Create an account</Link>
        </nav>
      </div>

      <div className="container footer__bar">
        <p>© {new Date().getFullYear()} CricHub</p>
        <p>
          Photographs via{' '}
          <a href="https://unsplash.com" target="_blank" rel="noreferrer noopener">
            Unsplash
          </a>
          , credited where they appear
        </p>
      </div>
    </footer>
  )
}
