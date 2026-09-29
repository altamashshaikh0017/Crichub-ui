import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Field from '../components/Field'
import { getMyProfile, updateMyProfile } from '../api/players'
import { ApiError } from '../api/client'
import { PLAYING_ROLES, BATTING_STYLES, BOWLING_STYLES } from '../api/auth'
import { roleLabel, batLabel, bowlLabel, NOT_SET } from '../lib/playerLabels'
import './Profile.css'

const SELECT_PLACEHOLDER = { value: '', label: '—' }

function initials(profile) {
  const letters = [profile.firstName?.[0], profile.lastName?.[0]].filter(Boolean).join('')
  if (letters) return letters.toUpperCase()
  return (profile.playerName?.[0] ?? '?').toUpperCase()
}

export default function Profile() {
  const [state, setState] = useState({ status: 'loading', data: null, error: null })
  const [editing, setEditing] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading', data: null, error: null })

    getMyProfile({ signal: controller.signal })
      .then((data) => setState({ status: 'ready', data, error: null }))
      .catch((error) => {
        if (controller.signal.aborted) return
        setState({ status: 'error', data: null, error })
      })

    return () => controller.abort()
  }, [])

  function handleSaved(updated) {
    setState((prev) => ({ ...prev, data: updated }))
    setEditing(false)
    setJustSaved(true)
  }

  return (
    <main className="profile">
      <div className="container">
        <p className="kicker">
          <span className="kicker__n">01</span>
          <span>Your account</span>
        </p>

        {state.status === 'loading' && <ProfileSkeleton />}
        {state.status === 'error' && <ProfileError error={state.error} />}

        {state.status === 'ready' &&
          (editing ? (
            <ProfileForm
              profile={state.data}
              onCancel={() => setEditing(false)}
              onSaved={handleSaved}
            />
          ) : (
            <>
              {justSaved && (
                <p className="profile__notice" role="status">
                  Profile updated.
                </p>
              )}
              <ProfileCard
                profile={state.data}
                onEdit={() => {
                  setJustSaved(false)
                  setEditing(true)
                }}
              />
            </>
          ))}

        <p className="profile__back">
          <Link to="/dashboard">← Back to dashboard</Link>
        </p>
      </div>
    </main>
  )
}

function ProfileCard({ profile, onEdit }) {
  // The player's name is shown in the header (and is editable), so it isn't
  // repeated here — a separate account "full name" would only contradict it.
  const rows = [
    ['Email', profile.email],
    ['Mobile', profile.mobileNumber],
    ['Playing role', roleLabel(profile.playingRole)],
    ['Batting style', batLabel(profile.battingStyle)],
    ['Bowling style', bowlLabel(profile.bowlingStyle)],
  ]

  return (
    <>
      <header className="profile__head">
        <span className="profile__monogram" aria-hidden="true">
          {initials(profile)}
        </span>
        <div>
          <h1 className="profile__name">{profile.playerName}</h1>
          <p className="profile__role">{roleLabel(profile.playingRole)}</p>
        </div>
        <button type="button" className="btn btn--outline btn--sm profile__edit" onClick={onEdit}>
          Edit profile
        </button>
      </header>

      <table className="profile__table">
        <caption className="visually-hidden">Your player profile</caption>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              <td>{value || <span className="profile__muted">{NOT_SET}</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {profile.playerId != null && (
        <p className="profile__stats-link">
          <Link to={`/players/${profile.playerId}/stats`}>View my career stats →</Link>
        </p>
      )}
    </>
  )
}

function ProfileForm({ profile, onCancel, onSaved }) {
  const [form, setForm] = useState({
    playerName: profile.playerName ?? '',
    playingRole: profile.playingRole ?? PLAYING_ROLES[0].value,
    battingStyle: profile.battingStyle ?? '',
    bowlingStyle: profile.bowlingStyle ?? '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    setFieldErrors({})
    setSubmitting(true)

    const payload = {
      playerName: form.playerName.trim(),
      playingRole: form.playingRole,
      battingStyle: form.battingStyle || null,
      bowlingStyle: form.bowlingStyle || null,
    }

    try {
      const updated = await updateMyProfile(payload)
      onSaved(updated)
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) {
        setFieldErrors(error.fieldErrors)
      }
      setFormError(
        error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
      )
      setSubmitting(false)
    }
  }

  return (
    <form className="profile__form" onSubmit={handleSubmit} noValidate>
      <h1 className="profile__name">Edit profile</h1>

      {formError && (
        <p className="profile__error-banner" role="alert">
          {formError}
        </p>
      )}

      <div className="profile__fields">
        <Field
          label="Player name"
          name="playerName"
          value={form.playerName}
          onChange={update}
          error={fieldErrors.playerName}
          required
        />

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

      <div className="profile__form-actions">
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save changes'}
        </button>
        <button
          type="button"
          className="btn btn--outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function ProfileError({ error }) {
  const status = error instanceof ApiError ? error.status : 0
  const sessionExpired = status === 401 || status === 403

  return (
    <div className="profile__error" role="alert">
      <h1 className="profile__name">Couldn’t load your profile</h1>
      <p>
        {sessionExpired
          ? 'Your session may have expired.'
          : error instanceof ApiError
            ? error.message
            : 'Something went wrong. Please try again.'}
      </p>
      {sessionExpired && (
        <p>
          <Link to="/login">Log in again</Link>
        </p>
      )}
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="profile__skeleton" aria-hidden="true">
      <div className="profile__head">
        <span className="profile__monogram sk" />
        <div>
          <span className="sk sk--title" />
          <span className="sk sk--sub" />
        </div>
      </div>
      <div className="sk sk--row" />
      <div className="sk sk--row" />
      <div className="sk sk--row" />
      <div className="sk sk--row" />
    </div>
  )
}
