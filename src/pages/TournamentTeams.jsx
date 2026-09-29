import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Field from '../components/Field'
import { getMyTeams } from '../api/teams'
import { getTournament, getRegisteredTeams, registerTeam, unregisterTeam } from '../api/tournaments'
import { ApiError } from '../api/client'
import './TournamentTeams.css'

export default function TournamentTeams() {
  const { tournamentId } = useParams()
  const [page, setPage] = useState({ status: 'loading', tournament: null, teams: [], error: null })
  const [registering, setRegistering] = useState(false)
  const [notice, setNotice] = useState(null)

  const loadTeams = useCallback(
    (signal) => {
      return getRegisteredTeams(tournamentId, { signal }).then((teams) =>
        setPage((prev) => ({ ...prev, teams: teams ?? [] })),
      )
    },
    [tournamentId],
  )

  useEffect(() => {
    const controller = new AbortController()
    setPage({ status: 'loading', tournament: null, teams: [], error: null })

    Promise.all([
      getTournament(tournamentId, { signal: controller.signal }),
      getRegisteredTeams(tournamentId, { signal: controller.signal }),
    ])
      .then(([tournament, teams]) =>
        setPage({ status: 'ready', tournament, teams: teams ?? [], error: null }),
      )
      .catch((error) => {
        if (controller.signal.aborted) return
        setPage({ status: 'error', tournament: null, teams: [], error })
      })

    return () => controller.abort()
  }, [tournamentId])

  function handleRegistered(name) {
    setRegistering(false)
    setNotice(`${name} registered.`)
    loadTeams()
  }

  const full =
    page.tournament && page.teams.length >= page.tournament.maxTeams

  return (
    <main className="tteams">
      <div className="container">
        {page.status === 'loading' && <TournamentTeamsSkeleton />}
        {page.status === 'error' && <TournamentTeamsError error={page.error} />}

        {page.status === 'ready' && (
          <>
            <header className="tteams__head">
              <div>
                <p className="kicker">
                  <span className="kicker__n">04</span>
                  <span>Registrations</span>
                </p>
                <h1 className="tteams__title">{page.tournament.tournamentName}</h1>
                <p className="tteams__lede">
                  {page.tournament.location} · {page.teams.length}/{page.tournament.maxTeams}{' '}
                  {page.teams.length === 1 ? 'team' : 'teams'} registered
                </p>
              </div>

              {!registering && !full && (
                <button
                  type="button"
                  className="btn btn--primary btn--sm tteams__add-btn"
                  onClick={() => {
                    setNotice(null)
                    setRegistering(true)
                  }}
                >
                  Register team
                </button>
              )}
            </header>

            {notice && !registering && (
              <p className="tteams__notice" role="status">
                {notice}
              </p>
            )}

            {registering ? (
              <RegisterTeamForm
                tournamentId={tournamentId}
                registered={page.teams}
                onCancel={() => setRegistering(false)}
                onRegistered={handleRegistered}
              />
            ) : page.teams.length === 0 ? (
              <EmptyRegistrations
                full={full}
                onRegister={() => {
                  setNotice(null)
                  setRegistering(true)
                }}
              />
            ) : (
              <ul className="tteams__list">
                {page.teams.map((team) => (
                  <li key={team.registrationId}>
                    <RegistrationRow
                      tournamentId={tournamentId}
                      team={team}
                      onRemoved={(message) => {
                        setNotice(message)
                        loadTeams()
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}

            {full && !registering && (
              <p className="tteams__full-note">This tournament is full.</p>
            )}
          </>
        )}

        <p className="tteams__back">
          <Link to="/tournaments">← Back to tournaments</Link>
        </p>
      </div>
    </main>
  )
}

function RegistrationRow({ tournamentId, team, onRemoved }) {
  const [confirming, setConfirming] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState(null)

  async function handleRemove() {
    setRemoving(true)
    setError(null)
    try {
      await unregisterTeam(tournamentId, team.registrationId)
      onRemoved(`${team.teamName} unregistered.`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not unregister the team.')
      setRemoving(false)
    }
  }

  return (
    <div className="tteams__row">
      <div className="tteams__who">
        <span className="tteams__name">{team.teamName}</span>
        <span className="tteams__since">Registered {team.registeredDate}</span>
      </div>

      {error && <span className="tteams__row-error">{error}</span>}

      {confirming ? (
        <span className="tteams__row-actions">
          <button
            type="button"
            className="btn btn--danger btn--sm"
            onClick={handleRemove}
            disabled={removing}
          >
            {removing ? 'Removing…' : 'Unregister'}
          </button>
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={() => setConfirming(false)}
            disabled={removing}
          >
            Cancel
          </button>
        </span>
      ) : (
        <button type="button" className="tteams__remove" onClick={() => setConfirming(true)}>
          Unregister
        </button>
      )}
    </div>
  )
}

function RegisterTeamForm({ tournamentId, registered, onCancel, onRegistered }) {
  const [teams, setTeams] = useState({ status: 'loading', options: [], error: null })
  const [teamId, setTeamId] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    getMyTeams({ signal: controller.signal })
      .then((myTeams) => {
        const registeredIds = new Set(registered.map((t) => t.teamId))
        const options = (myTeams ?? [])
          .filter((t) => !registeredIds.has(t.teamId))
          .map((t) => ({ value: String(t.teamId), label: t.teamName }))
        setTeams({ status: 'ready', options, error: null })
        setTeamId(options[0]?.value ?? '')
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        setTeams({ status: 'error', options: [], error })
      })
    return () => controller.abort()
  }, [registered])

  async function handleSubmit(event) {
    event.preventDefault()
    if (!teamId) return
    setFormError('')
    setSubmitting(true)

    const chosen = teams.options.find((o) => o.value === teamId)
    try {
      await registerTeam(tournamentId, Number(teamId))
      onRegistered(chosen?.label ?? 'Team')
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
      )
      setSubmitting(false)
    }
  }

  return (
    <form className="tteams__form" onSubmit={handleSubmit} noValidate>
      <h2 className="tteams__form-title">Register a team</h2>

      {formError && (
        <p className="tteams__error-banner" role="alert">
          {formError}
        </p>
      )}

      {teams.status === 'loading' && <p className="tteams__form-note">Loading your teams…</p>}

      {teams.status === 'error' && (
        <p className="tteams__error-banner" role="alert">
          Couldn’t load your teams. Please try again.
        </p>
      )}

      {teams.status === 'ready' &&
        (teams.options.length === 0 ? (
          <p className="tteams__form-note">
            Every team you manage is already registered, or you don’t have any yet.{' '}
            <Link to="/teams">Create a team</Link> first.
          </p>
        ) : (
          <div className="tteams__fields">
            <Field
              label="Your team"
              name="teamId"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              options={teams.options}
              required
            />
          </div>
        ))}

      <div className="tteams__form-actions">
        <button
          type="submit"
          className="btn btn--primary"
          disabled={submitting || teams.status !== 'ready' || teams.options.length === 0}
        >
          {submitting ? 'Registering…' : 'Register team'}
        </button>
        <button type="button" className="btn btn--outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>
    </form>
  )
}

function EmptyRegistrations({ full, onRegister }) {
  return (
    <div className="tteams__empty">
      <h2>No teams registered</h2>
      <p>
        {full
          ? 'This tournament is full.'
          : 'Register the first side — pick one of the teams you manage.'}
      </p>
      {!full && (
        <button type="button" className="btn btn--primary" onClick={onRegister}>
          Register a team
        </button>
      )}
    </div>
  )
}

function TournamentTeamsError({ error }) {
  const status = error instanceof ApiError ? error.status : 0
  const notFound = status === 404
  const sessionExpired = status === 401 || status === 403

  return (
    <div className="tteams__state" role="alert">
      <h1 className="tteams__title">
        {notFound ? 'Tournament not found' : 'Couldn’t load registrations'}
      </h1>
      <p>
        {notFound
          ? 'This tournament doesn’t exist.'
          : sessionExpired
            ? 'Your session may have expired.'
            : error instanceof ApiError
              ? error.message
              : 'Something went wrong.'}
      </p>
      <Link to={sessionExpired ? '/login' : '/tournaments'} className="btn btn--outline">
        {sessionExpired ? 'Log in again' : 'Back to tournaments'}
      </Link>
    </div>
  )
}

function TournamentTeamsSkeleton() {
  return (
    <div aria-hidden="true">
      <span className="sk sk--title" style={{ height: 34, width: 260, display: 'block' }} />
      <ul className="tteams__list" style={{ marginTop: 32 }}>
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <div className="tteams__row">
              <span className="sk" style={{ height: 16, width: '40%' }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
