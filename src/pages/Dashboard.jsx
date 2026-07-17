import { useAuth } from '../auth/AuthContext'
import './Dashboard.css'

/* The product sequence, mirroring how a club sets up a season. None of these
   have backend endpoints yet, so they're laid out as what's coming next. */
const NEXT_STEPS = [
  {
    n: '01',
    title: 'My profile',
    body: 'The player profile created when you signed up — your role, batting style and bowling style, ready to edit.',
  },
  {
    n: '02',
    title: 'My teams',
    body: 'Create a team, name its captain, and leave one contact number so organisers know who to ring.',
  },
  {
    n: '03',
    title: 'Squads',
    body: 'Pull registered players and guests into your team, and set who’s keeping.',
  },
  {
    n: '04',
    title: 'Tournaments',
    body: 'Browse tournaments and their formats — overs, ball, dates and the number of sides they’ll take.',
  },
  {
    n: '05',
    title: 'Registrations',
    body: 'Enter your team for a tournament and track every one of your entries in one list.',
  },
]

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
              Signed in as <strong>{user?.email}</strong>. Your season lives here — the pieces below
              are landing next.
            </p>
          </div>

          <button type="button" className="btn btn--outline btn--sm dash__signout" onClick={signOut}>
            Log out
          </button>
        </header>

        <section className="dash__panel" aria-label="Getting set up">
          <p className="dash__panel-note">
            The API for these is still being built, so they’re read-only previews for now. The moment
            an endpoint ships, its card here goes live.
          </p>

          <ol className="dash__steps">
            {NEXT_STEPS.map((step) => (
              <li key={step.n} className="dash__step">
                <div className="dash__step-top">
                  <span className="dash__step-n">{step.n}</span>
                  <span className="dash__badge">Coming soon</span>
                </div>
                <h2 className="dash__step-title">{step.title}</h2>
                <p className="dash__step-body">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  )
}
