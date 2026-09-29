import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Field from '../components/Field'
import { getTeam } from '../api/teams'
import { getSquad, addSquadPlayer, removeSquadPlayer } from '../api/squad'
import { ApiError } from '../api/client'
import { PLAYING_ROLES, BATTING_STYLES, BOWLING_STYLES } from '../api/auth'
import { roleLabel } from '../lib/playerLabels'
import './Squad.css'

const SELECT_PLACEHOLDER = { value: '', label: '—' }

export default function Squad() {
  const { teamId } = useParams()
  const [page, setPage] = useState({ status: 'loading', team: null, squad: [], error: null })
  const [adding, setAdding] = useState(false)
  const [notice, setNotice] = useState(null)

  const loadSquad = useCallback(
    (signal) => {
      return getSquad(teamId, { signal }).then((squad) =>
        setPage((prev) => ({ ...prev, squad: squad ?? [] })),
      )
    },
    [teamId],
  )

  useEffect(() => {
    const controller = new AbortController()
    setPage({ status: 'loading', team: null, squad: [], error: null })

    Promise.all([getTeam(teamId, { signal: controller.signal }), getSquad(teamId, { signal: controller.signal })])
      .then(([team, squad]) => setPage({ status: 'ready', team, squad: squad ?? [], error: null }))
      .catch((error) => {
        if (controller.signal.aborted) return
        setPage({ status: 'error', team: null, squad: [], error })
      })

    return () => controller.abort()
  }, [teamId])

  function handleAdded(name) {
    setAdding(false)
    setNotice(`${name} added to the squad.`)
    loadSquad()
  }

  return (
    <main className="squad">
      <div className="container">
        {page.status === 'loading' && <SquadSkeleton />}
        {page.status === 'error' && <SquadError error={page.error} />}

        {page.status === 'ready' && (
          <>
            <header className="squad__head">
              <div>
                <p className="kicker">
                  <span className="kicker__n">03</span>
                  <span>Squad</span>
                </p>
                <h1 className="squad__title">{page.team.teamName}</h1>
                <p className="squad__lede">
                  Captain {page.team.captainName} · {page.squad.length}{' '}
                  {page.squad.length === 1 ? 'player' : 'players'}
                </p>
              </div>

              {!adding && (
                <button
                  type="button"
                  className="btn btn--primary btn--sm squad__add-btn"
                  onClick={() => {
                    setNotice(null)
                    setAdding(true)
                  }}
                >
                  Add player
                </button>
              )}
            </header>

            {notice && !adding && (
              <p className="squad__notice" role="status">
                {notice}
              </p>
            )}

            {adding ? (
              <AddPlayerForm teamId={teamId} onCancel={() => setAdding(false)} onAdded={handleAdded} />
            ) : page.squad.length === 0 ? (
              <EmptySquad onAdd={() => setAdding(true)} />
            ) : (
              <ul className="roster">
                {page.squad.map((player) => (
                  <li key={player.teamPlayerId}>
                    <PlayerRow
                      teamId={teamId}
                      player={player}
                      onRemoved={(message) => {
                        setNotice(message)
                        loadSquad()
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        <p className="squad__back">
          <Link to="/teams">← Back to teams</Link>
        </p>
      </div>
    </main>
  )
}

function PlayerRow({ teamId, player, onRemoved }) {
  const [confirming, setConfirming] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState(null)

  async function handleRemove() {
    setRemoving(true)
    setError(null)
    try {
      await removeSquadPlayer(teamId, player.teamPlayerId)
      onRemoved(`${player.playerName} removed from the squad.`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not remove the player.')
      setRemoving(false)
    }
  }

  return (
    <div className="roster__row">
      <span className="roster__jersey" aria-label={player.jerseyNumber ? `Jersey ${player.jerseyNumber}` : undefined}>
        {player.jerseyNumber ?? '—'}
      </span>

      <div className="roster__who">
        <span className="roster__name">
          {player.playerName}
          {player.guest && <span className="roster__tag">Guest</span>}
        </span>
        <span className="roster__role">{roleLabel(player.playingRole)}</span>
      </div>

      {error && <span className="roster__error">{error}</span>}

      {confirming ? (
        <span className="roster__actions">
          <button type="button" className="btn btn--danger btn--sm" onClick={handleRemove} disabled={removing}>
            {removing ? 'Removing…' : 'Remove'}
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
        <button type="button" className="roster__remove" onClick={() => setConfirming(true)}>
          Remove
        </button>
      )}
    </div>
  )
}

function AddPlayerForm({ teamId, onCancel, onAdded }) {
  const [form, setForm] = useState({
    playerName: '',
    playingRole: PLAYING_ROLES[0].value,
    battingStyle: '',
    bowlingStyle: '',
    mobileNumber: '',
    jerseyNumber: '',
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
      mobileNumber: form.mobileNumber.trim() || null,
      jerseyNumber: form.jerseyNumber === '' ? null : Number(form.jerseyNumber),
    }

    try {
      await addSquadPlayer(teamId, payload)
      onAdded(payload.playerName)
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
    <form className="squad__form" onSubmit={handleSubmit} noValidate>
      <h2 className="squad__form-title">Add a player</h2>

      {formError && (
        <p className="squad__error-banner" role="alert">
          {formError}
        </p>
      )}

      <div className="squad__fields">
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

        <div className="field-row">
          <Field
            label="Mobile number"
            name="mobileNumber"
            type="tel"
            autoComplete="tel"
            placeholder="Links an existing player if it matches"
            value={form.mobileNumber}
            onChange={update}
            error={fieldErrors.mobileNumber}
            hint="Optional. A matching mobile links that player instead of creating a guest."
            optional
          />
          <Field
            label="Jersey number"
            name="jerseyNumber"
            type="number"
            inputMode="numeric"
            min="0"
            max="999"
            value={form.jerseyNumber}
            onChange={update}
            error={fieldErrors.jerseyNumber}
            optional
          />
        </div>
      </div>

      <div className="squad__form-actions">
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Adding…' : 'Add to squad'}
        </button>
        <button type="button" className="btn btn--outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>
    </form>
  )
}

function EmptySquad({ onAdd }) {
  return (
    <div className="squad__empty">
      <h2>No players yet</h2>
      <p>Add your first player — a registered member by mobile, or a guest by name.</p>
      <button type="button" className="btn btn--primary" onClick={onAdd}>
        Add a player
      </button>
    </div>
  )
}

function SquadError({ error }) {
  const status = error instanceof ApiError ? error.status : 0
  const notFound = status === 404
  const sessionExpired = status === 401 || status === 403

  return (
    <div className="squad__state" role="alert">
      <h1 className="squad__title">
        {notFound ? 'Team not found' : 'Couldn’t load the squad'}
      </h1>
      <p>
        {notFound
          ? 'This team doesn’t exist, or it isn’t one of yours.'
          : sessionExpired
            ? 'Your session may have expired.'
            : error instanceof ApiError
              ? error.message
              : 'Something went wrong.'}
      </p>
      <Link to={sessionExpired ? '/login' : '/teams'} className="btn btn--outline">
        {sessionExpired ? 'Log in again' : 'Back to teams'}
      </Link>
    </div>
  )
}

function SquadSkeleton() {
  return (
    <div aria-hidden="true">
      <span className="sk sk--title" style={{ height: 34, width: 260, display: 'block' }} />
      <ul className="roster" style={{ marginTop: 32 }}>
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <div className="roster__row">
              <span className="sk" style={{ width: 34, height: 34 }} />
              <span className="sk" style={{ height: 16, width: '40%' }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
