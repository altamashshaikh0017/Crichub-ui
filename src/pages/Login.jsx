import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Field from '../components/Field'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { PHOTOS } from '../data/photos'
import './Auth.css'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signIn } = useAuth()
  const justSignedUp = location.state?.justSignedUp
  // Where to go after login: back to the page that bounced us here, else dashboard.
  const from = location.state?.from?.pathname || '/dashboard'
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // Already signed in? Skip the form.
  if (user) return <Navigate to={from} replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    setFieldErrors({})
    setSubmitting(true)
    try {
      await signIn({ email: form.email.trim(), password: form.password })
      navigate(from, { replace: true })
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) {
        setFieldErrors(error.fieldErrors)
      }
      setFormError(
        error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth auth--split">
      <div className="auth__main">
        <form className="auth__form" onSubmit={handleSubmit} noValidate>
          <p className="kicker">
            <span className="kicker__n">—</span>
            <span>Welcome back</span>
          </p>
          <h1 className="auth__title">Log in to CricHub</h1>
          <p className="auth__lede">Pick up where you left off — your squads, tournaments and entries.</p>

          {justSignedUp && !formError && (
            <p className="auth__notice" role="status">
              Account created. Log in to get started.
            </p>
          )}

          {formError && (
            <p className="auth__error" role="alert">
              {formError}
            </p>
          )}

          <div className="auth__fields">
            <Field
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={update}
              error={fieldErrors.email}
              required
            />

            <Field
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Your password"
              value={form.password}
              onChange={update}
              error={fieldErrors.password}
              required
            >
              <button
                type="button"
                className="field__reveal"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </Field>
          </div>

          <button type="submit" className="btn btn--primary auth__submit" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Log in'}
          </button>

          <p className="auth__alt">
            New to CricHub? <Link to="/signup">Create an account</Link>
          </p>
        </form>
      </div>

      <aside className="auth__aside" aria-hidden="true">
        <img src={PHOTOS.floodlights.src} alt="" className="auth__aside-img" />
        <div className="auth__aside-quote">
          <p>Run the season, not the spreadsheet.</p>
          <span>CricHub</span>
        </div>
      </aside>
    </main>
  )
}
