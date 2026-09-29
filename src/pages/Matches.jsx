import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Field from '../components/Field'
import { getMatches, createMatch, updateMatch, deleteMatch } from '../api/matches'
import { getTournaments, getRegisteredTeams } from '../api/tournaments'
import { getMyTeams } from '../api/teams'
import { ApiError } from '../api/client'
import './Matches.css'

const STATUS_LABELS = {
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  ABANDONED: 'Abandoned',
}

/** "2026-04-12" → "12 Apr 2026". */
function formatDate(iso) {
  if (!iso) return '—'
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

/** "150/7 (20)" style score line for one team. */
function scoreLine(runs, wickets, overs) {
  if (runs == null && wickets == null) return '—'
  const rw = `${runs ?? 0}/${wickets ?? 0}`
  return overs != null ? `${rw} (${overs})` : rw
}

export default function Matches() {
  const [list, setList] = useState({ status: 'loading', matches: [], error: null })
  const [editor, setEditor] = useState(null) // null | {mode:'create'} | {mode:'edit', match}
  const [notice, setNotice] = useState(null)

  const load = useCallback((signal) => {
    return getMatches({ signal })
      .then((matches) => setList({ status: 'ready', matches: matches ?? [], error: null }))
      .catch((error) => {
        if (signal?.aborted) return
        setList({ status: 'error', matches: [], error })
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
  const openEdit = (match) => {
    setNotice(null)
    setEditor({ mode: 'edit', match })
  }

  function handleSaved(message) {
    setEditor(null)
    setNotice(message)
    load()
  }

  return (
    <main className="matches">
      <div className="container">
        <header className="matches__head">
          <div>
            <p className="kicker">
              <span className="kicker__n">06</span>
              <span>Play</span>
            </p>
            <h1 className="matches__title">Matches</h1>
            <p className="matches__lede">
              Schedule games between two teams — as a tournament fixture or a standalone friendly —
              then record the result.
            </p>
          </div>

          {!editor && list.status === 'ready' && list.matches.length > 0 && (
            <button
              type="button"
              className="btn btn--primary btn--sm matches__new"
              onClick={openCreate}
            >
              New match
            </button>
          )}
        </header>

        {notice && !editor && (
          <p className="matches__notice" role="status">
            {notice}
          </p>
        )}

        {editor ? (
          <MatchForm
            mode={editor.mode}
            match={editor.match}
            onCancel={() => setEditor(null)}
            onSaved={handleSaved}
          />
        ) : (
          <>
            {list.status === 'loading' && <MatchesSkeleton />}
            {list.status === 'error' && <MatchesError error={list.error} onRetry={() => load()} />}
            {list.status === 'ready' &&
              (list.matches.length === 0 ? (
                <EmptyMatches onCreate={openCreate} />
              ) : (
                <ul className="match-grid">
                  {list.matches.map((match) => (
                    <li key={match.matchId}>
                      <MatchCard
                        match={match}
                        onEdit={() => openEdit(match)}
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

        <p className="matches__back">
          <Link to="/dashboard">← Back to dashboard</Link>
        </p>
      </div>
    </main>
  )
}

function MatchCard({ match, onEdit, onDeleted }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)

  const completed = match.status === 'COMPLETED'

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      await deleteMatch(match.matchId)
      onDeleted('Match deleted.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete the match.')
      setDeleting(false)
    }
  }

  return (
    <article className="match-card">
      <div className="match-card__top">
        <span className={`match-card__status match-card__status--${match.status?.toLowerCase()}`}>
          {STATUS_LABELS[match.status] ?? match.status}
        </span>
        <span className="match-card__comp">{match.tournamentName ?? 'Standalone'}</span>
      </div>

      <div className="match-card__teams">
        <span className="match-card__team">{match.teamAName}</span>
        <span className="match-card__vs">vs</span>
        <span className="match-card__team">{match.teamBName}</span>
      </div>

      {completed && (
        <dl className="match-card__score">
          <div>
            <dt>{match.teamAName}</dt>
            <dd>{scoreLine(match.teamARuns, match.teamAWickets, match.teamAOvers)}</dd>
          </div>
          <div>
            <dt>{match.teamBName}</dt>
            <dd>{scoreLine(match.teamBRuns, match.teamBWickets, match.teamBOvers)}</dd>
          </div>
        </dl>
      )}

      <p className="match-card__result">
        {completed
          ? (match.resultSummary ??
            (match.winnerName ? `${match.winnerName} won` : 'No result'))
          : `${formatDate(match.matchDate)} · ${match.venue} · ${match.overs} overs`}
      </p>

      {error && <p className="match-card__error">{error}</p>}

      {confirming ? (
        <div className="match-card__confirm">
          <span>Delete this match?</span>
          <div className="match-card__actions">
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
        <div className="match-card__actions">
          <Link to={`/matches/${match.matchId}/result`} className="btn btn--primary btn--sm">
            {completed ? 'Edit result' : 'Record result'}
          </Link>
          <Link to={`/matches/${match.matchId}/scorecard`} className="btn btn--outline btn--sm">
            Scorecard
          </Link>
          <button type="button" className="btn btn--outline btn--sm" onClick={onEdit}>
            Edit
          </button>
          <button type="button" className="match-card__delete" onClick={() => setConfirming(true)}>
            Delete
          </button>
        </div>
      )}
    </article>
  )
}

const NO_TOURNAMENT = ''

function MatchForm({ mode, match, onCancel, onSaved }) {
  const [form, setForm] = useState({
    tournamentId: match?.tournamentId != null ? String(match.tournamentId) : NO_TOURNAMENT,
    teamAId: match?.teamAId != null ? String(match.teamAId) : '',
    teamBId: match?.teamBId != null ? String(match.teamBId) : '',
    matchDate: match?.matchDate ?? '',
    venue: match?.venue ?? '',
    overs: match?.overs != null ? String(match.overs) : '',
  })
  const [tournaments, setTournaments] = useState([])
  const [teams, setTeams] = useState({ status: 'loading', options: [] })
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Load the tournament options once.
  useEffect(() => {
    const controller = new AbortController()
    getTournaments({ signal: controller.signal })
      .then((rows) =>
        setTournaments((rows ?? []).map((t) => ({ value: String(t.tournamentId), label: t.tournamentName }))),
      )
      .catch(() => {
        if (!controller.signal.aborted) setTournaments([])
      })
    return () => controller.abort()
  }, [])

  // Load eligible teams whenever the tournament selection changes: a tournament's
  // registered teams, or the user's own teams for a standalone match.
  useEffect(() => {
    const controller = new AbortController()
    setTeams({ status: 'loading', options: [] })

    const source =
      form.tournamentId === NO_TOURNAMENT
        ? getMyTeams({ signal: controller.signal })
        : getRegisteredTeams(form.tournamentId, { signal: controller.signal })

    source
      .then((rows) =>
        setTeams({
          status: 'ready',
          options: (rows ?? []).map((t) => ({ value: String(t.teamId), label: t.teamName })),
        }),
      )
      .catch(() => {
        if (controller.signal.aborted) return
        setTeams({ status: 'error', options: [] })
      })
    return () => controller.abort()
  }, [form.tournamentId])

  const update = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onTournamentChange = (event) => {
    // Switching the team source: clear stale team picks.
    setForm((prev) => ({ ...prev, tournamentId: event.target.value, teamAId: '', teamBId: '' }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    setFieldErrors({})
    setSubmitting(true)

    const payload = {
      tournamentId: form.tournamentId === NO_TOURNAMENT ? null : Number(form.tournamentId),
      teamAId: form.teamAId === '' ? null : Number(form.teamAId),
      teamBId: form.teamBId === '' ? null : Number(form.teamBId),
      matchDate: form.matchDate || null,
      venue: form.venue.trim(),
      overs: form.overs === '' ? null : Number(form.overs),
    }

    try {
      if (mode === 'edit') {
        await updateMatch(match.matchId, payload)
        onSaved('Match updated.')
      } else {
        await createMatch(payload)
        onSaved('Match created.')
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

  const teamOptions = [{ value: '', label: 'Select a team' }, ...teams.options]
  const teamHint =
    teams.status === 'error'
      ? 'Could not load teams.'
      : form.tournamentId === NO_TOURNAMENT
        ? 'Your teams.'
        : 'Teams registered in this tournament.'

  return (
    <form className="matches__form" onSubmit={handleSubmit} noValidate>
      <h2 className="matches__form-title">{mode === 'edit' ? 'Edit match' : 'New match'}</h2>

      {formError && (
        <p className="matches__error-banner" role="alert">
          {formError}
        </p>
      )}

      <div className="matches__fields">
        <Field
          label="Tournament"
          name="tournamentId"
          value={form.tournamentId}
          onChange={onTournamentChange}
          options={[{ value: NO_TOURNAMENT, label: 'None (standalone)' }, ...tournaments]}
          hint="Optional — leave as standalone for a friendly."
        />

        <div className="field-row">
          <Field
            label="Team A"
            name="teamAId"
            value={form.teamAId}
            onChange={update}
            error={fieldErrors.teamAId}
            options={teamOptions}
            hint={teamHint}
            required
          />
          <Field
            label="Team B"
            name="teamBId"
            value={form.teamBId}
            onChange={update}
            error={fieldErrors.teamBId}
            options={teamOptions}
            required
          />
        </div>

        <div className="field-row">
          <Field
            label="Match date"
            name="matchDate"
            type="date"
            value={form.matchDate}
            onChange={update}
            error={fieldErrors.matchDate}
            required
          />
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
            hint={form.tournamentId === NO_TOURNAMENT ? undefined : 'Defaults to the tournament overs.'}
          />
        </div>

        <Field
          label="Venue"
          name="venue"
          value={form.venue}
          onChange={update}
          error={fieldErrors.venue}
          required
        />
      </div>

      <div className="matches__form-actions">
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create match'}
        </button>
        <button type="button" className="btn btn--outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>
    </form>
  )
}

function EmptyMatches({ onCreate }) {
  return (
    <div className="matches__empty">
      <h2>No matches yet</h2>
      <p>Schedule your first game — pick two teams, a date and a venue.</p>
      <button type="button" className="btn btn--primary" onClick={onCreate}>
        Create a match
      </button>
    </div>
  )
}

function MatchesError({ error, onRetry }) {
  const status = error instanceof ApiError ? error.status : 0
  const sessionExpired = status === 401 || status === 403

  return (
    <div className="matches__state" role="alert">
      <h2>Couldn’t load matches</h2>
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

function MatchesSkeleton() {
  return (
    <ul className="match-grid" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <li key={i}>
          <div className="match-card match-card--sk">
            <span className="sk sk--line" />
            <span className="sk sk--name" />
            <span className="sk sk--line" />
          </div>
        </li>
      ))}
    </ul>
  )
}
