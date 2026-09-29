import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getTournament, getStandings } from '../api/tournaments'
import { ApiError } from '../api/client'
import './TournamentStandings.css'

/** Net run rate: signed, 3 decimals, or an em dash when not yet computable. */
function formatNrr(nrr) {
  if (nrr == null) return '—'
  return `${nrr > 0 ? '+' : ''}${nrr.toFixed(3)}`
}

export default function TournamentStandings() {
  const { tournamentId } = useParams()
  const [page, setPage] = useState({ status: 'loading', tournament: null, rows: [], error: null })

  useEffect(() => {
    const controller = new AbortController()
    setPage({ status: 'loading', tournament: null, rows: [], error: null })

    Promise.all([
      getTournament(tournamentId, { signal: controller.signal }),
      getStandings(tournamentId, { signal: controller.signal }),
    ])
      .then(([tournament, rows]) =>
        setPage({ status: 'ready', tournament, rows: rows ?? [], error: null }),
      )
      .catch((error) => {
        if (controller.signal.aborted) return
        setPage({ status: 'error', tournament: null, rows: [], error })
      })

    return () => controller.abort()
  }, [tournamentId])

  return (
    <main className="standings">
      <div className="container">
        {page.status === 'loading' && <p className="standings__loading">Loading standings…</p>}
        {page.status === 'error' && <StandingsError error={page.error} />}

        {page.status === 'ready' && (
          <>
            <header className="standings__head">
              <p className="kicker">
                <span className="kicker__n">04</span>
                <span>Points table</span>
              </p>
              <h1 className="standings__title">{page.tournament.tournamentName}</h1>
              <p className="standings__lede">
                {page.tournament.location} · standings from completed matches
              </p>
              <nav className="standings__tabs" aria-label="Tournament views">
                <Link to={`/tournaments/${tournamentId}/teams`}>Teams</Link>
                <span className="standings__tab is-active" aria-current="page">
                  Table
                </span>
              </nav>
            </header>

            {page.rows.length === 0 ? (
              <div className="standings__empty">
                <h2>No teams yet</h2>
                <p>Register teams and record match results to build the table.</p>
                <Link to={`/tournaments/${tournamentId}/teams`} className="btn btn--primary">
                  Manage teams
                </Link>
              </div>
            ) : (
              <div className="standings__table-wrap">
                <table className="standings__table">
                  <thead>
                    <tr>
                      <th scope="col" className="standings__rank">#</th>
                      <th scope="col" className="standings__team-col">Team</th>
                      <th scope="col" title="Played">P</th>
                      <th scope="col" title="Won">W</th>
                      <th scope="col" title="Lost">L</th>
                      <th scope="col" title="Tied">T</th>
                      <th scope="col" title="No result">NR</th>
                      <th scope="col" title="Points" className="standings__pts">Pts</th>
                      <th scope="col" title="Net run rate">NRR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {page.rows.map((row) => (
                      <tr key={row.teamId}>
                        <td className="standings__rank">{row.rank}</td>
                        <th scope="row" className="standings__team-col">{row.teamName}</th>
                        <td>{row.played}</td>
                        <td>{row.won}</td>
                        <td>{row.lost}</td>
                        <td>{row.tied}</td>
                        <td>{row.noResult}</td>
                        <td className="standings__pts">{row.points}</td>
                        <td className="standings__nrr">{formatNrr(row.netRunRate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        <p className="standings__back">
          <Link to="/tournaments">← Back to tournaments</Link>
        </p>
      </div>
    </main>
  )
}

function StandingsError({ error }) {
  const status = error instanceof ApiError ? error.status : 0
  const notFound = status === 404
  const sessionExpired = status === 401 || status === 403

  return (
    <div className="standings__state" role="alert">
      <h1 className="standings__title">
        {notFound ? 'Tournament not found' : 'Couldn’t load the standings'}
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
