import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPlayerStats } from '../api/players'
import { ApiError } from '../api/client'
import { roleLabel } from '../lib/playerLabels'
import './PlayerStats.css'

const dash = (v) => (v == null ? '—' : v)

export default function PlayerStats() {
  const { playerId } = useParams()
  const [page, setPage] = useState({ status: 'loading', stats: null, error: null })

  useEffect(() => {
    const controller = new AbortController()
    setPage({ status: 'loading', stats: null, error: null })
    getPlayerStats(playerId, { signal: controller.signal })
      .then((stats) => setPage({ status: 'ready', stats, error: null }))
      .catch((error) => {
        if (controller.signal.aborted) return
        setPage({ status: 'error', stats: null, error })
      })
    return () => controller.abort()
  }, [playerId])

  return (
    <main className="pstats">
      <div className="container">
        {page.status === 'loading' && <p className="pstats__loading">Loading stats…</p>}
        {page.status === 'error' && <StatsError error={page.error} />}

        {page.status === 'ready' && <StatsBody stats={page.stats} />}

        <p className="pstats__back">
          <Link to="/dashboard">← Back to dashboard</Link>
        </p>
      </div>
    </main>
  )
}

function StatsBody({ stats }) {
  const bat = stats.batting
  const bowl = stats.bowling

  return (
    <>
      <header className="pstats__head">
        <p className="kicker">
          <span className="kicker__n">01</span>
          <span>Career stats</span>
        </p>
        <h1 className="pstats__title">{stats.playerName}</h1>
        <p className="pstats__lede">
          {roleLabel(stats.playingRole)} · {stats.matches} {stats.matches === 1 ? 'match' : 'matches'}
        </p>
      </header>

      <div className="pstats__cards">
        <section className="pstats__card">
          <h2 className="pstats__card-title">Batting</h2>
          <dl className="pstats__grid">
            <Stat label="Innings" value={bat.innings} />
            <Stat label="Runs" value={bat.runs} accent />
            <Stat label="Highest" value={dash(bat.highestScore)} />
            <Stat label="Average" value={dash(bat.average)} />
            <Stat label="Strike rate" value={dash(bat.strikeRate)} />
            <Stat label="Not outs" value={bat.notOuts} />
            <Stat label="50s" value={bat.fifties} />
            <Stat label="100s" value={bat.hundreds} />
            <Stat label="Fours" value={bat.fours} />
            <Stat label="Sixes" value={bat.sixes} />
            <Stat label="Balls faced" value={bat.ballsFaced} />
          </dl>
        </section>

        <section className="pstats__card">
          <h2 className="pstats__card-title">Bowling</h2>
          <dl className="pstats__grid">
            <Stat label="Innings" value={bowl.innings} />
            <Stat label="Wickets" value={bowl.wickets} accent />
            <Stat label="Best" value={dash(bowl.bestBowling)} />
            <Stat label="Average" value={dash(bowl.average)} />
            <Stat label="Economy" value={dash(bowl.economy)} />
            <Stat label="Overs" value={bowl.overs} />
            <Stat label="Runs" value={bowl.runsConceded} />
            <Stat label="Maidens" value={bowl.maidens} />
          </dl>
        </section>
      </div>
    </>
  )
}

function Stat({ label, value, accent }) {
  return (
    <div className="pstats__stat">
      <dt>{label}</dt>
      <dd className={accent ? 'is-accent' : undefined}>{value}</dd>
    </div>
  )
}

function StatsError({ error }) {
  const status = error instanceof ApiError ? error.status : 0
  const notFound = status === 404
  const sessionExpired = status === 401 || status === 403

  return (
    <div className="pstats__state" role="alert">
      <h1 className="pstats__title">{notFound ? 'Player not found' : 'Couldn’t load stats'}</h1>
      <p>
        {notFound
          ? 'This player doesn’t exist.'
          : sessionExpired
            ? 'Your session may have expired.'
            : error instanceof ApiError
              ? error.message
              : 'Something went wrong.'}
      </p>
      <Link to={sessionExpired ? '/login' : '/dashboard'} className="btn btn--outline">
        {sessionExpired ? 'Log in again' : 'Back to dashboard'}
      </Link>
    </div>
  )
}
