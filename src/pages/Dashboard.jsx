import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import './Dashboard.css'

/* The product sequence, mirroring how a club sets up a season. `ready` cards
   link to a live feature; the rest are previews until their APIs ship. */
const NEXT_STEPS = [
  {
    n: '01',
    title: 'My profile',
    body: 'The player profile created when you signed up — your role, batting style and bowling style.',
    to: '/profile',
    ready: true,
  },
  {
    n: '02',
    title: 'My teams',
    body: 'Create a team, name its captain, and leave one contact number so organisers know who to ring.',
    to: '/teams',
    ready: true,
  },
  {
    n: '03',
    title: 'Squads',
    body: 'Open one of your teams to build its squad — add registered players by mobile, or guests by name.',
    to: '/teams',
    ready: true,
  },
  {
    n: '04',
    title: 'Tournaments',
    body: 'Browse tournaments and their formats — overs, ball, dates and the number of sides they’ll take.',
    to: '/tournaments',
    ready: true,
  },
  {
    n: '05',
    title: 'Registrations',
    body: 'Open a tournament to register one of your teams and see every side that has entered.',
    to: '/tournaments',
    ready: true,
  },
  {
    n: '06',
    title: 'Matches',
    body: 'Schedule games between two teams — a tournament fixture or a friendly — and record the toss and result.',
    to: '/matches',
    ready: true,
  },
]

function StepContent({ step }) {
  return (
    <>
      <div className="dash__step-top">
        <span className="dash__step-n">{step.n}</span>
        <span className={`dash__badge ${step.ready ? 'dash__badge--live' : ''}`}>
          {step.ready ? 'Ready' : 'Coming soon'}
        </span>
      </div>
      <h2 className="dash__step-title">{step.title}</h2>
      <p className="dash__step-body">{step.body}</p>
      {step.ready && <span className="dash__step-cta">Open →</span>}
    </>
  )
}

export default function Dashboard() {
  const { user, signOut } = useAuth()

  return (
    <main className="dash">
      <div className="container">
        <header className="dash__head">
          <div>
            <p className="kicker">
              <span className="kicker__n">—</span>
              <span>Your account</span>
            </p>
            <h1 className="dash__title">Welcome back</h1>
            <p className="dash__lede">
              Signed in as <strong>{user?.email}</strong>. Your profile is ready — the rest of your
              season is landing next.
            </p>
          </div>

          <button type="button" className="btn btn--outline btn--sm dash__signout" onClick={signOut}>
            Log out
          </button>
        </header>

        <section className="dash__panel" aria-label="Getting set up">
          <p className="dash__panel-note">
            Every step is live — set up your profile, teams and squads, then take a side to a
            tournament.
          </p>

          <ol className="dash__steps">
            {NEXT_STEPS.map((step) => (
              <li key={step.n} className="dash__step-cell">
                {step.ready ? (
                  <Link to={step.to} className="dash__step dash__step--live">
                    <StepContent step={step} />
                  </Link>
                ) : (
                  <div className="dash__step">
                    <StepContent step={step} />
                  </div>
                )}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  )
}
