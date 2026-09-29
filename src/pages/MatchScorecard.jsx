import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getMatch, getScorecard, saveScorecard } from '../api/matches'
import { getSquad } from '../api/squad'
import { ApiError } from '../api/client'
import { roleLabel } from '../lib/playerLabels'
import './MatchScorecard.css'

const num = (v) => (v === '' || v == null ? null : Number(v))
const str = (v) => (v == null ? '' : String(v))

const emptyRow = (teamId) => ({
  teamId,
  runs: '',
  ballsFaced: '',
  fours: '',
  sixes: '',
  notOut: false,
  oversBowled: '',
  runsConceded: '',
  wickets: '',
  maidens: '',
})

/** A row counts for saving if any figure was entered (or the batter is not out). */
function hasData(row) {
  const stats = ['runs', 'ballsFaced', 'fours', 'sixes', 'oversBowled', 'runsConceded', 'wickets', 'maidens']
  return stats.some((k) => row[k] !== '' && row[k] != null) || row.notOut === true
}

export default function MatchScorecard() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const [page, setPage] = useState({ status: 'loading', match: null, squads: null, error: null })
  const [perf, setPerf] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const opts = { signal: controller.signal }
    setPage({ status: 'loading', match: null, squads: null, error: null })

    getMatch(matchId, opts)
      .then((match) =>
        Promise.all([
          getSquad(match.teamAId, opts),
          getSquad(match.teamBId, opts),
          getScorecard(matchId, opts),
        ]).then(([squadA, squadB, card]) => ({ match, squadA: squadA ?? [], squadB: squadB ?? [], card })),
      )
      .then(({ match, squadA, squadB, card }) => {
        setPerf(buildInitial(match, squadA, squadB, card))
        setPage({ status: 'ready', match, squads: { A: squadA, B: squadB }, error: null })
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        setPage({ status: 'error', match: null, squads: null, error })
      })

    return () => controller.abort()
  }, [matchId])

  const setField = (playerId, field, value) => {
    setPerf((prev) => ({ ...prev, [playerId]: { ...prev[playerId], [field]: value } }))
  }

  async function handleSave() {
    setFormError('')
    setSaving(true)

    const performances = Object.entries(perf)
      .filter(([, row]) => hasData(row))
      .map(([playerId, row]) => ({
        playerId: Number(playerId),
        teamId: row.teamId,
        runs: num(row.runs),
        ballsFaced: num(row.ballsFaced),
        fours: num(row.fours),
        sixes: num(row.sixes),
        notOut: row.notOut || null,
        oversBowled: num(row.oversBowled),
        runsConceded: num(row.runsConceded),
        wickets: num(row.wickets),
        maidens: num(row.maidens),
      }))

    try {
      await saveScorecard(matchId, { performances })
      navigate('/matches')
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
      )
      setSaving(false)
    }
  }

  return (
    <main className="scard">
      <div className="container">
        {page.status === 'loading' && <p className="scard__loading">Loading scorecard…</p>}
        {page.status === 'error' && <ScorecardError error={page.error} />}

        {page.status === 'ready' && (
          <>
            <header className="scard__head">
              <p className="kicker">
                <span className="kicker__n">06</span>
                <span>Scorecard</span>
              </p>
              <h1 className="scard__title">
                {page.match.teamAName} <span className="scard__vs">vs</span> {page.match.teamBName}
              </h1>
              <p className="scard__lede">
                {page.match.tournamentName ?? 'Standalone'} · fill in each player’s figures, then save.
              </p>
            </header>

            {formError && (
              <p className="scard__error-banner" role="alert">
                {formError}
              </p>
            )}

            <TeamSheet
              teamName={page.match.teamAName}
              teamId={page.match.teamAId}
              squad={page.squads.A}
              perf={perf}
              onChange={setField}
            />
            <TeamSheet
              teamName={page.match.teamBName}
              teamId={page.match.teamBId}
              squad={page.squads.B}
              perf={perf}
              onChange={setField}
            />

            <div className="scard__actions">
              <button type="button" className="btn btn--primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save scorecard'}
              </button>
              <Link to="/matches" className="btn btn--outline">
                Cancel
              </Link>
            </div>
          </>
        )}

        <p className="scard__back">
          <Link to="/matches">← Back to matches</Link>
        </p>
      </div>
    </main>
  )
}

function TeamSheet({ teamName, teamId, squad, perf, onChange }) {
  const rows = useMemo(() => squad ?? [], [squad])

  if (rows.length === 0) {
    return (
      <section className="scard__team">
        <h2 className="scard__team-name">{teamName}</h2>
        <p className="scard__empty">No squad players for this team yet.</p>
      </section>
    )
  }

  return (
    <section className="scard__team">
      <h2 className="scard__team-name">{teamName}</h2>
      <div className="scard__table-wrap">
        <table className="scard__table">
          <thead>
            <tr>
              <th scope="col" className="scard__player-col">Player</th>
              <th scope="col" title="Runs">R</th>
              <th scope="col" title="Balls faced">B</th>
              <th scope="col" title="Fours">4s</th>
              <th scope="col" title="Sixes">6s</th>
              <th scope="col" title="Not out">NO</th>
              <th scope="col" title="Overs bowled">Ov</th>
              <th scope="col" title="Runs conceded">R</th>
              <th scope="col" title="Wickets">W</th>
              <th scope="col" title="Maidens">M</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((sp) => {
              const row = perf[sp.playerId] ?? emptyRow(teamId)
              const cell = (field, extra = {}) => (
                <input
                  className="scard__input"
                  type="number"
                  min="0"
                  value={row[field]}
                  onChange={(e) => onChange(sp.playerId, field, e.target.value)}
                  {...extra}
                />
              )
              return (
                <tr key={sp.playerId}>
                  <th scope="row" className="scard__player-col">
                    <span className="scard__player-name">{sp.playerName}</span>
                    <span className="scard__player-role">{roleLabel(sp.playingRole)}</span>
                  </th>
                  <td>{cell('runs')}</td>
                  <td>{cell('ballsFaced')}</td>
                  <td>{cell('fours')}</td>
                  <td>{cell('sixes')}</td>
                  <td>
                    <input
                      type="checkbox"
                      className="scard__check"
                      checked={row.notOut}
                      onChange={(e) => onChange(sp.playerId, 'notOut', e.target.checked)}
                      aria-label={`${sp.playerName} not out`}
                    />
                  </td>
                  <td>{cell('oversBowled', { step: '0.1' })}</td>
                  <td>{cell('runsConceded')}</td>
                  <td>{cell('wickets', { max: '10' })}</td>
                  <td>{cell('maidens')}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/** Seeds a row per squad player, then overlays any saved scorecard figures. */
function buildInitial(match, squadA, squadB, card) {
  const perf = {}
  squadA.forEach((sp) => (perf[sp.playerId] = emptyRow(match.teamAId)))
  squadB.forEach((sp) => (perf[sp.playerId] = emptyRow(match.teamBId)))

  const overlay = (teamId, performances) => {
    ;(performances ?? []).forEach((p) => {
      perf[p.playerId] = {
        teamId,
        runs: str(p.runs),
        ballsFaced: str(p.ballsFaced),
        fours: str(p.fours),
        sixes: str(p.sixes),
        notOut: p.notOut ?? false,
        oversBowled: str(p.oversBowled),
        runsConceded: str(p.runsConceded),
        wickets: str(p.wickets),
        maidens: str(p.maidens),
      }
    })
  }
  overlay(match.teamAId, card?.teamA?.performances)
  overlay(match.teamBId, card?.teamB?.performances)
  return perf
}

function ScorecardError({ error }) {
  const status = error instanceof ApiError ? error.status : 0
  const notFound = status === 404
  const forbidden = status === 403
  const sessionExpired = status === 401

  return (
    <div className="scard__state" role="alert">
      <h1 className="scard__title">
        {notFound ? 'Match not found' : forbidden ? 'Can’t edit this scorecard' : 'Couldn’t load the scorecard'}
      </h1>
      <p>
        {notFound
          ? 'This match doesn’t exist.'
          : forbidden
            ? 'You can only enter a scorecard for teams you manage.'
            : sessionExpired
              ? 'Your session may have expired.'
              : error instanceof ApiError
                ? error.message
                : 'Something went wrong.'}
      </p>
      <Link to={sessionExpired ? '/login' : '/matches'} className="btn btn--outline">
        {sessionExpired ? 'Log in again' : 'Back to matches'}
      </Link>
    </div>
  )
}
