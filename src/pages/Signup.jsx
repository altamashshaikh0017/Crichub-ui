import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Field from '../components/Field'
import { signup, PLAYING_ROLES, BATTING_STYLES, BOWLING_STYLES } from '../api/auth'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { PHOTOS } from '../data/photos'
import './Auth.css'

const EMPTY = {
  firstName: '',
  lastName: '',
  email: '',
  mobileNumber: '',
  password: '',
  playingRole: 'BATSMAN',
  battingStyle: '',
  bowlingStyle: '',
}

const SELECT_PLACEHOLDER = { value: '', label: '—' }

/** Matches the backend @Pattern on mobileNumber: exactly 10 digits. */
const MOBILE_RE = /^[0-9]{10}$/

export default function Signup() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [form, setForm] = useState(EMPTY)
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Already signed in? No reason to see the signup form.
  if (user) return <Navigate to="/dashboard" replace />

  const update = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    setFieldErrors({})
    setSubmitting(true)

    // The form is noValidate, so the native pattern check never fires — enforce
    // the backend's 10-digit rule here, surfaced through the same inline error UI.
    const mobileNumber = form.mobileNumber.trim()
    if (!MOBILE_RE.test(mobileNumber)) {
      setFieldErrors({ mobileNumber: 'Mobile number must be exactly 10 digits.' })
      setSubmitting(false)
      return
    }

    // Only send the optional style fields when the player has chosen one.
    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      mobileNumber,
      password: form.password,
      playingRole: form.playingRole,
      ...(form.battingStyle && { battingStyle: form.battingStyle }),
      ...(form.bowlingStyle && { bowlingStyle: form.bowlingStyle }),
    }

    try {
      await signup(payload)
      navigate('/login', { state: { justSignedUp: true } })
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
    <main className="auth auth--split auth--wide">
      <div className="auth__main">
        <form className="auth__form" onSubmit={handleSubmit} noValidate>
          <p className="kicker">
            <span className="kicker__n">—</span>
            <span>Get started</span>
          </p>
          <h1 className="auth__title">Create your account</h1>
          <p className="auth__lede">
            Your player profile is created as you register — playing role, batting and bowling style
            included. There is no second form to fill in.
          </p>

          {formError && (
            <p className="auth__error" role="alert">
              {formError}
            </p>
          )}

          <div className="auth__fields">
            <div className="field-row">
              <Field
                label="First name"
                name="firstName"
                autoComplete="given-name"
                value={form.firstName}
                onChange={update}
                error={fieldErrors.firstName}
                required
              />
              <Field
                label="Last name"
                name="lastName"
                autoComplete="family-name"
                value={form.lastName}
                onChange={update}
                error={fieldErrors.lastName}
                required
              />
            </div>

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
              label="Mobile number"
              name="mobileNumber"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              autoComplete="tel"
              placeholder="e.g. 9876543210"
              value={form.mobileNumber}
              onChange={update}
              error={fieldErrors.mobileNumber}
              hint="10 digits, no spaces or country code."
              required
            />

            <Field
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={update}
              error={fieldErrors.password}
              hint="Use 8 or more characters."
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

            <Field
              label="Playing role"
              name="playingRole"
              value={form.playingRole}
              onChange={update}
              error={fieldErrors.playingRole}
              options={PLAYING_ROLES}
              required
            />

            <div className="field-row">
              <Field
                label="Batting style"
                name="battingStyle"
                value={form.battingStyle}
                onChange={update}
                error={fieldErrors.battingStyle}
                options={[SELECT_PLACEHOLDER, ...BATTING_STYLES]}
                optional
              />
              <Field
                label="Bowling style"
                name="bowlingStyle"
                value={form.bowlingStyle}
                onChange={update}
                error={fieldErrors.bowlingStyle}
                options={[SELECT_PLACEHOLDER, ...BOWLING_STYLES]}
                optional
              />
            </div>
          </div>

          <button type="submit" className="btn btn--primary auth__submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </button>

          <p className="auth__alt">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>
      </div>

      <aside className="auth__aside" aria-hidden="true">
        <img src={PHOTOS.nets.src} alt="" className="auth__aside-img" />
        <div className="auth__aside-quote">
          <p>Sign up once. Bring the whole squad across when you’re ready.</p>
          <span>CricHub</span>
        </div>
      </aside>
    </main>
  )
}
