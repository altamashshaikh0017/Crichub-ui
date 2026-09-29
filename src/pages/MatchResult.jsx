import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Field from '../components/Field'
import { getMatch, recordResult } from '../api/matches'
import { ApiError } from '../api/client'
import './MatchResult.css'

const TOSS_DECISIONS = [
  { value: 'BAT', label: 'Bat' },
  { value: 'BOWL', label: 'Bowl' },
]

const RESULT_TYPES = [
  { value: 'WON', label: 'Won' },
  { value: 'TIE', label: 'Tie' },
  { value: 'NO_RESULT', label: 'No result' },
  { value: 'ABANDONED', label: 'Abandoned' },
]

const numOrNull = (v) => (v === '' || v == null ? null : Number(v))
const str = (v) => (v == null ? '' : String(v))

export default function MatchResult() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const [page, setPage] = useState({ status: 'loading', match: null, error: null })

  useEffect(() => {
    const controller = new AbortController()
    setPage({ status: 'loading', match: null, error: null })
    getMatch(matchId, { signal: controller.signal })
      .then((match) => setPage({ status: 'ready', match, error: null }))
      .catch((error) => {
        if (controller.signal.aborted) return
        setPage({ status: 'error', match: null, error })
      })
    return () => controller.abort()
  }, [matchId])

  return (
    <main className="mresult">
      <div className="container">
        {page.status === 'loading' && <p className="mresult__loading">Loading match…</p>}
        {page.status === 'error' && <MatchResultError error={page.error} />}
        {page.status === 'ready' && (
          <ResultForm
            match={page.match}
            onSaved={() => navigate('/matches')}
          />
        )}
        <p className="mresult__back">
          <Link to="/matches">← Back to matches</Link>
        </p>
      </div>
    </main>
  )
}

function ResultForm({ match, onSaved }) {
  const teamOptions = [
    { value: str(match.teamAId), label: match.teamAName },
    { value: str(match.teamBId), label: match.teamBName },
  ]

  const [form, setForm] = useState({
    tossWinnerId: str(match.tossWinnerId),
    tossDecision: str(match.tossDecision),
    teamARuns: str(match.teamARuns),
    teamAWickets: str(match.teamAWickets),
    teamAOvers: str(match.teamAOvers),
    teamBRuns: str(match.teamBRuns),
    teamBWickets: str(match.teamBWickets),
    teamBOvers: str(match.teamBOvers),
    resultType: match.resultType ?? 'WON',
    winnerId: str(match.winnerId),
    resultSummary: match.resultSummary ?? '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const isWon = form.resultType === 'WON'

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    setFieldErrors({})
    setSubmitting(true)

    const payload = {
      tossWinnerId: numOrNull(form.tossWinnerId),
      tossDecision: form.tossDecision || null,
      teamARuns: numOrNull(form.teamARuns),
      teamAWickets: numOrNull(form.teamAWickets),
      teamAOvers: numOrNull(form.teamAOvers),
      teamBRuns: numOrNull(form.teamBRuns),
      teamBWickets: numOrNull(form.teamBWickets),
      teamBOvers: numOrNull(form.teamBOvers),
      resultType: form.resultType,
      winnerId: isWon ? numOrNull(form.winnerId) : null,
      resultSummary: form.resultSummary.trim() || null,
    }

    try {
      await recordResult(match.matchId, payload)
      onSaved()
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
    <>
      <header className="mresult__head">
        <p className="kicker">
          <span className="kicker__n">06</span>
          <span>Result</span>
        </p>
        <h1 className="mresult__title">
          {match.teamAName} <span className="mresult__vs">vs</span> {match.teamBName}
        </h1>
        <p className="mresult__lede">
          {match.tournamentName ?? 'Standalone'} · {match.overs} overs
        </p>
      </header>

      <form className="mresult__form" onSubmit={handleSubmit} noValidate>
        {formError && (
          <p className="mresult__error-banner" role="alert">
            {formError}
          </p>
        )}

        <fieldset className="mresult__group">
          <legend>Toss</legend>
          <div className="field-row">
            <Field
              label="Toss winner"
              name="tossWinnerId"
              value={form.tossWinnerId}
              onChange={update}
              options={[{ value: '', label: '—' }, ...teamOptions]}
              optional
            />
            <Field
              label="Chose to"
              name="tossDecision"
              value={form.tossDecision}
              onChange={update}
              options={[{ value: '', label: '—' }, ...TOSS_DECISIONS]}
              optional
            />
          </div>
        </fieldset>

        <fieldset className="mresult__group">
          <legend>{match.teamAName}</legend>
          <div className="field-row field-row--three">
            <Field label="Runs" name="teamARuns" type="number" min="0" value={form.teamARuns} onChange={update} error={fieldErrors.teamARuns} optional />
            <Field label="Wickets" name="teamAWickets" type="number" min="0" max="10" value={form.teamAWickets} onChange={update} error={fieldErrors.teamAWickets} optional />
            <Field label="Overs" name="teamAOvers" type="number" min="0" step="0.1" value={form.teamAOvers} onChange={update} error={fieldErrors.teamAOvers} optional />
          </div>
        </fieldset>

        <fieldset className="mresult__group">
          <legend>{match.teamBName}</legend>
          <div className="field-row field-row--three">
            <Field label="Runs" name="teamBRuns" type="number" min="0" value={form.teamBRuns} onChange={update} error={fieldErrors.teamBRuns} optional />
            <Field label="Wickets" name="teamBWickets" type="number" min="0" max="10" value={form.teamBWickets} onChange={update} error={fieldErrors.teamBWickets} optional />
            <Field label="Overs" name="teamBOvers" type="number" min="0" step="0.1" value={form.teamBOvers} onChange={update} error={fieldErrors.teamBOvers} optional />
          </div>
        </fieldset>

        <fieldset className="mresult__group">
          <legend>Outcome</legend>
          <div className="field-row">
            <Field
              label="Result"
              name="resultType"
              value={form.resultType}
              onChange={update}
              options={RESULT_TYPES}
              required
            />
            {isWon && (
              <Field
                label="Winner"
                name="winnerId"
                value={form.winnerId}
                onChange={update}
                options={[{ value: '', label: 'Select the winner' }, ...teamOptions]}
                error={fieldErrors.winnerId}
                required
              />
            )}
          </div>
          <Field
            label="Summary"
            name="resultSummary"
            placeholder="e.g. Team A won by 5 wickets"
            value={form.resultSummary}
            onChange={update}
            optional
          />
        </fieldset>

        <div className="mresult__actions">
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save result'}
          </button>
          <Link to="/matches" className="btn btn--outline">
            Cancel
          </Link>
        </div>
      </form>
    </>
  )
}

function MatchResultError({ error }) {
  const status = error instanceof ApiError ? error.status : 0
  const notFound = status === 404
  const sessionExpired = status === 401 || status === 403

  return (
    <div className="mresult__state" role="alert">
      <h1 className="mresult__title">{notFound ? 'Match not found' : 'Couldn’t load the match'}</h1>
      <p>
        {notFound
          ? 'This match doesn’t exist.'
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
