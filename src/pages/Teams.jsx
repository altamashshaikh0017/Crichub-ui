import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Field from '../components/Field'
import { getMyTeams, createTeam, updateTeam, deleteTeam } from '../api/teams'
import { ApiError } from '../api/client'
import './Teams.css'

export default function Teams() {
  const [list, setList] = useState({ status: 'loading', teams: [], error: null })
  const [editor, setEditor] = useState(null) // null | {mode:'create'} | {mode:'edit', team}
  const [notice, setNotice] = useState(null)

  const load = useCallback((signal) => {
    return getMyTeams({ signal })
      .then((teams) => setList({ status: 'ready', teams: teams ?? [], error: null }))
      .catch((error) => {
        if (signal?.aborted) return
        setList({ status: 'error', teams: [], error })
      })
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const openCreate = () => {
    setNotice(null)
    setEditor({ mode: 'create' })
  }
  const openEdit = (team) => {
    setNotice(null)
    setEditor({ mode: 'edit', team })
  }

  function handleSaved(message) {
    setEditor(null)
    setNotice(message)
    load()
  }

  return (
    <main className="teams">
      <div className="container">
        <header className="teams__head">
          <div>
            <p className="kicker">
              <span className="kicker__n">02</span>
              <span>Your account</span>
            </p>
            <h1 className="teams__title">My teams</h1>
            <p className="teams__lede">
              The sides you manage — create one, then bring it to a tournament.
            </p>
          </div>

          {!editor && list.status === 'ready' && list.teams.length > 0 && (
            <button type="button" className="btn btn--primary btn--sm teams__new" onClick={openCreate}>
              New team
            </button>
          )}
        </header>

        {notice && !editor && (
          <p className="teams__notice" role="status">
            {notice}
          </p>
        )}

        {editor ? (
          <TeamForm
            mode={editor.mode}
            team={editor.team}
            onCancel={() => setEditor(null)}
            onSaved={handleSaved}
          />
        ) : (
          <>
            {list.status === 'loading' && <TeamsSkeleton />}
            {list.status === 'error' && <TeamsError error={list.error} onRetry={() => load()} />}
            {list.status === 'ready' &&
              (list.teams.length === 0 ? (
                <EmptyTeams onCreate={openCreate} />
              ) : (
                <ul className="team-grid">
                  {list.teams.map((team) => (
                    <li key={team.teamId}>
                      <TeamCard
                        team={team}
                        onEdit={() => openEdit(team)}
                        onDeleted={(message) => {
                          setNotice(message)
                          load()
                        }}
                      />
                    </li>
                  ))}
                </ul>
              ))}
          </>
        )}

        <p className="teams__back">
          <Link to="/dashboard">← Back to dashboard</Link>
        </p>
      </div>
    </main>
  )
}

function TeamCard({ team, onEdit, onDeleted }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      await deleteTeam(team.teamId)
      onDeleted(`“${team.teamName}” deleted.`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete the team.')
      setDeleting(false)
    }
  }

  return (
    <article className="team-card">
      <h2 className="team-card__name">{team.teamName}</h2>

      <dl className="team-card__meta">
        <div>
          <dt>Captain</dt>
          <dd>{team.captainName}</dd>
        </div>
        <div>
          <dt>Contact</dt>
          <dd>{team.contactNumber}</dd>
        </div>
      </dl>

      {error && <p className="team-card__error">{error}</p>}

      {confirming ? (
        <div className="team-card__confirm">
          <span>Delete this team?</span>
          <div className="team-card__actions">
            <button
              type="button"
              className="btn btn--danger btn--sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => setConfirming(false)}
              disabled={deleting}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="team-card__actions">
          <Link to={`/teams/${team.teamId}/squad`} className="btn btn--primary btn--sm">
            Squad
          </Link>
          <button type="button" className="btn btn--outline btn--sm" onClick={onEdit}>
            Edit
          </button>
          <button type="button" className="team-card__delete" onClick={() => setConfirming(true)}>
            Delete
          </button>
        </div>
      )}
    </article>
  )
}

function TeamForm({ mode, team, onCancel, onSaved }) {
  const [form, setForm] = useState({
    teamName: team?.teamName ?? '',
    captainName: team?.captainName ?? '',
    contactNumber: team?.contactNumber ?? '',
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
      teamName: form.teamName.trim(),
      captainName: form.captainName.trim(),
      contactNumber: form.contactNumber.trim(),
    }

    try {
      if (mode === 'edit') {
        await updateTeam(team.teamId, payload)
        onSaved('Team updated.')
      } else {
        await createTeam(payload)
        onSaved('Team created.')
      }
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
    <form className="teams__form" onSubmit={handleSubmit} noValidate>
      <h2 className="teams__form-title">{mode === 'edit' ? 'Edit team' : 'New team'}</h2>

      {formError && (
        <p className="teams__error-banner" role="alert">
          {formError}
        </p>
      )}

      <div className="teams__fields">
        <Field
          label="Team name"
          name="teamName"
          value={form.teamName}
          onChange={update}
          error={fieldErrors.teamName}
          required
        />
        <Field
          label="Captain name"
          name="captainName"
          autoComplete="name"
          value={form.captainName}
          onChange={update}
          error={fieldErrors.captainName}
          required
        />
        <Field
          label="Contact number"
          name="contactNumber"
          type="tel"
          autoComplete="tel"
          placeholder="e.g. 9876543210"
          value={form.contactNumber}
          onChange={update}
          error={fieldErrors.contactNumber}
          required
        />
      </div>

      <div className="teams__form-actions">
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create team'}
        </button>
        <button type="button" className="btn btn--outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>
    </form>
  )
}

function EmptyTeams({ onCreate }) {
  return (
    <div className="teams__empty">
      <h2>No teams yet</h2>
      <p>Create your first side — give it a name, a captain, and a contact number.</p>
      <button type="button" className="btn btn--primary" onClick={onCreate}>
        Create a team
      </button>
    </div>
  )
}

function TeamsError({ error, onRetry }) {
  const status = error instanceof ApiError ? error.status : 0
  const sessionExpired = status === 401 || status === 403

  return (
    <div className="teams__state" role="alert">
      <h2>Couldn’t load your teams</h2>
      <p>
        {sessionExpired
          ? 'Your session may have expired.'
          : error instanceof ApiError
            ? error.message
            : 'Something went wrong.'}
      </p>
      {sessionExpired ? (
        <Link to="/login" className="btn btn--outline">
          Log in again
        </Link>
      ) : (
        <button type="button" className="btn btn--outline" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

function TeamsSkeleton() {
  return (
    <ul className="team-grid" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <li key={i}>
          <div className="team-card team-card--sk">
            <span className="sk sk--name" />
            <span className="sk sk--line" />
            <span className="sk sk--line" />
          </div>
        </li>
      ))}
    </ul>
  )
}
