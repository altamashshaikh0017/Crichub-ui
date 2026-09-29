import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getTournament, getLeaderboard } from '../api/tournaments'
import { ApiError } from '../api/client'
import './TournamentLeaderboard.css'

const dash = (v) => (v == null ? '—' : v)

export default function TournamentLeaderboard() {
  const { tournamentId } = useParams()
  const [page, setPage] = useState({ status: 'loading', tournament: null, board: null, error: null })

  useEffect(() => {
    const controller = new AbortController()
    setPage({ status: 'loading', tournament: null, board: null, error: null })

    Promise.all([
      getTournament(tournamentId, { signal: controller.signal }),
      getLeaderboard(tournamentId, { signal: controller.signal }),
    ])
      .then(([tournament, board]) => setPage({ status: 'ready', tournament, board, error: null }))
      .catch((error) => {
        if (controller.signal.aborted) return
        setPage({ status: 'error', tournament: null, board: null, error })
      })

    return () => controller.abort()
  }, [tournamentId])

  return (
    <main className="lb">
      <div className="container">
        {page.status === 'loading' && <p className="lb__loading">Loading leaderboard…</p>}
        {page.status === 'error' && <LeaderboardError error={page.error} />}

        {page.status === 'ready' && (
          <>
            <header className="lb__head">
              <p className="kicker">
                <span className="kicker__n">04</span>
                <span>Leaderboard</span>
              </p>
              <h1 className="lb__title">{page.tournament.tournamentName}</h1>
              <p className="lb__lede">{page.tournament.location} · top performers</p>
              <nav className="lb__tabs" aria-label="Tournament views">
                <Link to={`/tournaments/${tournamentId}/teams`}>Teams</Link>
                <Link to={`/tournaments/${tournamentId}/standings`}>Table</Link>
                <span className="lb__tab is-active" aria-current="page">Leaderboard</span>
              </nav>
            </header>

            <div className="lb__grid">
              <RunScorers rows={page.board.topRunScorers} />
              <WicketTakers rows={page.board.topWicketTakers} />
            </div>
          </>
        )}

        <p className="lb__back">
          <Link to="/tournaments">← Back to tournaments</Link>
        </p>
      </div>
    </main>
  )
}

function RunScorers({ rows }) {
  return (
    <section className="lb__card">
      <h2 className="lb__card-title">Most runs</h2>
      {(!rows || rows.length === 0) ? (
        <p className="lb__empty">No batting data yet.</p>
      ) : (
        <ol className="lb__list">
          {rows.map((r) => (
            <li key={r.playerId} className="lb__row">
              <span className="lb__rank">{r.rank}</span>
              <span className="lb__who">
                <Link to={`/players/${r.playerId}/stats`} className="lb__name">{r.playerName}</Link>
                <span className="lb__team">{r.teamName}</span>
              </span>
              <span className="lb__metric">
                <strong>{r.runs}</strong>
                <span className="lb__sub">SR {dash(r.strikeRate)}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function WicketTakers({ rows }) {
  return (
    <section className="lb__card">
      <h2 className="lb__card-title">Most wickets</h2>
      {(!rows || rows.length === 0) ? (
        <p className="lb__empty">No bowling data yet.</p>
      ) : (
        <ol className="lb__list">
          {rows.map((w) => (
            <li key={w.playerId} className="lb__row">
              <span className="lb__rank">{w.rank}</span>
              <span className="lb__who">
                <Link to={`/players/${w.playerId}/stats`} className="lb__name">{w.playerName}</Link>
                <span className="lb__team">{w.teamName}</span>
              </span>
              <span className="lb__metric">
                <strong>{w.wickets}</strong>
                <span className="lb__sub">Econ {dash(w.economy)}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function LeaderboardError({ error }) {
  const status = error instanceof ApiError ? error.status : 0
  const notFound = status === 404
  const sessionExpired = status === 401 || status === 403

  return (
    <div className="lb__state" role="alert">
      <h1 className="lb__title">{notFound ? 'Tournament not found' : 'Couldn’t load the leaderboard'}</h1>
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
