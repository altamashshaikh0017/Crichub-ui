import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Field from '../components/Field'
import {
  getTournaments,
  createTournament,
  updateTournament,
  deleteTournament,
} from '../api/tournaments'
import { ApiError } from '../api/client'
import './Tournaments.css'

/** "2026-04-12" → "12 Apr 2026" (dates come back as plain ISO strings). */
function formatDate(iso) {
  if (!iso) return '—'
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Tournaments() {
  const [list, setList] = useState({ status: 'loading', tournaments: [], error: null })
  const [editor, setEditor] = useState(null) // null | {mode:'create'} | {mode:'edit', tournament}
  const [notice, setNotice] = useState(null)

  const load = useCallback((signal) => {
    return getTournaments({ signal })
      .then((tournaments) =>
        setList({ status: 'ready', tournaments: tournaments ?? [], error: null }),
      )
      .catch((error) => {
        if (signal?.aborted) return
        setList({ status: 'error', tournaments: [], error })
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
  const openEdit = (tournament) => {
    setNotice(null)
    setEditor({ mode: 'edit', tournament })
  }

  function handleSaved(message) {
    setEditor(null)
    setNotice(message)
    load()
  }

  return (
    <main className="tournaments">
      <div className="container">
        <header className="tournaments__head">
          <div>
            <p className="kicker">
              <span className="kicker__n">04</span>
              <span>Compete</span>
            </p>
            <h1 className="tournaments__title">Tournaments</h1>
            <p className="tournaments__lede">
              Every tournament and its format — overs, ball, dates and how many sides it takes.
              Open one to register teams.
            </p>
          </div>

          {!editor && list.status === 'ready' && list.tournaments.length > 0 && (
            <button
              type="button"
              className="btn btn--primary btn--sm tournaments__new"
              onClick={openCreate}
            >
              New tournament
            </button>
          )}
        </header>

        {notice && !editor && (
          <p className="tournaments__notice" role="status">
            {notice}
          </p>
        )}

        {editor ? (
          <TournamentForm
            mode={editor.mode}
            tournament={editor.tournament}
            onCancel={() => setEditor(null)}
            onSaved={handleSaved}
          />
        ) : (
          <>
            {list.status === 'loading' && <TournamentsSkeleton />}
            {list.status === 'error' && (
              <TournamentsError error={list.error} onRetry={() => load()} />
            )}
            {list.status === 'ready' &&
              (list.tournaments.length === 0 ? (
                <EmptyTournaments onCreate={openCreate} />
              ) : (
                <ul className="tournament-grid">
                  {list.tournaments.map((tournament) => (
                    <li key={tournament.tournamentId}>
                      <TournamentCard
                        tournament={tournament}
                        onEdit={() => openEdit(tournament)}
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

        <p className="tournaments__back">
          <Link to="/dashboard">← Back to dashboard</Link>
        </p>
      </div>
    </main>
  )
}

function TournamentCard({ tournament, onEdit, onDeleted }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)

  const full = tournament.registeredTeamsCount >= tournament.maxTeams

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      await deleteTournament(tournament.tournamentId)
      onDeleted(`“${tournament.tournamentName}” deleted.`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete the tournament.')
      setDeleting(false)
    }
  }

  return (
    <article className="tournament-card">
      <div className="tournament-card__top">
        <h2 className="tournament-card__name">{tournament.tournamentName}</h2>
        <span className={`tournament-card__slots ${full ? 'is-full' : ''}`}>
          {tournament.registeredTeamsCount}/{tournament.maxTeams} teams
        </span>
      </div>

      <p className="tournament-card__where">{tournament.location}</p>

      <dl className="tournament-card__meta">
        <div>
          <dt>Format</dt>
          <dd>
            {tournament.overs} overs · {tournament.ballType}
          </dd>
        </div>
        <div>
          <dt>Dates</dt>
          <dd>
            {formatDate(tournament.startDate)} – {formatDate(tournament.endDate)}
          </dd>
        </div>
      </dl>

      {error && <p className="tournament-card__error">{error}</p>}

      {confirming ? (
        <div className="tournament-card__confirm">
          <span>Delete this tournament? Its registrations are removed too.</span>
          <div className="tournament-card__actions">
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
        <div className="tournament-card__actions">
          <Link
            to={`/tournaments/${tournament.tournamentId}/teams`}
            className="btn btn--primary btn--sm"
          >
            Teams
          </Link>
          <button type="button" className="btn btn--outline btn--sm" onClick={onEdit}>
            Edit
          </button>
          <button
            type="button"
            className="tournament-card__delete"
            onClick={() => setConfirming(true)}
          >
            Delete
          </button>
        </div>
      )}
    </article>
  )
}

function TournamentForm({ mode, tournament, onCancel, onSaved }) {
  const [form, setForm] = useState({
    tournamentName: tournament?.tournamentName ?? '',
    location: tournament?.location ?? '',
    overs: tournament?.overs != null ? String(tournament.overs) : '',
    startDate: tournament?.startDate ?? '',
    endDate: tournament?.endDate ?? '',
    ballType: tournament?.ballType ?? '',
    maxTeams: tournament?.maxTeams != null ? String(tournament.maxTeams) : '',
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
      tournamentName: form.tournamentName.trim(),
      location: form.location.trim(),
      overs: form.overs === '' ? null : Number(form.overs),
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      ballType: form.ballType.trim(),
      maxTeams: form.maxTeams === '' ? null : Number(form.maxTeams),
    }

    try {
      if (mode === 'edit') {
        await updateTournament(tournament.tournamentId, payload)
        onSaved('Tournament updated.')
      } else {
        await createTournament(payload)
        onSaved('Tournament created.')
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
    <form className="tournaments__form" onSubmit={handleSubmit} noValidate>
      <h2 className="tournaments__form-title">
        {mode === 'edit' ? 'Edit tournament' : 'New tournament'}
      </h2>

      {formError && (
        <p className="tournaments__error-banner" role="alert">
          {formError}
        </p>
      )}

      <div className="tournaments__fields">
        <Field
          label="Tournament name"
          name="tournamentName"
          value={form.tournamentName}
          onChange={update}
          error={fieldErrors.tournamentName}
          required
        />
        <Field
          label="Location"
          name="location"
          value={form.location}
          onChange={update}
          error={fieldErrors.location}
          required
        />

        <div className="field-row">
          <Field
            label="Overs"
            name="overs"
            type="number"
            inputMode="numeric"
            min="1"
            max="999"
            value={form.overs}
            onChange={update}
            error={fieldErrors.overs}
            required
          />
          <Field
            label="Ball type"
            name="ballType"
            placeholder="e.g. Leather, Tennis"
            value={form.ballType}
            onChange={update}
            error={fieldErrors.ballType}
            required
          />
        </div>

        <div className="field-row">
          <Field
            label="Start date"
            name="startDate"
            type="date"
            value={form.startDate}
            onChange={update}
            error={fieldErrors.startDate}
            required
          />
          <Field
            label="End date"
            name="endDate"
            type="date"
            value={form.endDate}
            onChange={update}
            error={fieldErrors.endDate}
            required
          />
        </div>

        <Field
          label="Max teams"
          name="maxTeams"
          type="number"
          inputMode="numeric"
          min="2"
          max="999"
          value={form.maxTeams}
          onChange={update}
          error={fieldErrors.maxTeams}
          hint="How many sides the tournament will take."
          required
        />
      </div>

      <div className="tournaments__form-actions">
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create tournament'}
        </button>
        <button type="button" className="btn btn--outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>
    </form>
  )
}

function EmptyTournaments({ onCreate }) {
  return (
    <div className="tournaments__empty">
      <h2>No tournaments yet</h2>
      <p>Set one up — a name, a venue, the format, its dates, and how many sides it takes.</p>
      <button type="button" className="btn btn--primary" onClick={onCreate}>
        Create a tournament
      </button>
    </div>
  )
}

function TournamentsError({ error, onRetry }) {
  const status = error instanceof ApiError ? error.status : 0
  const sessionExpired = status === 401 || status === 403

  return (
    <div className="tournaments__state" role="alert">
      <h2>Couldn’t load tournaments</h2>
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

function TournamentsSkeleton() {
  return (
    <ul className="tournament-grid" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <li key={i}>
          <div className="tournament-card tournament-card--sk">
            <span className="sk sk--name" />
            <span className="sk sk--line" />
            <span className="sk sk--line" />
          </div>
        </li>
      ))}
    </ul>
  )
}
