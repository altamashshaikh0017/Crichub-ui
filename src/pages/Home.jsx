import { Link } from 'react-router-dom'
import Figure from '../components/Figure'
import { PHOTOS } from '../data/photos'
import './Home.css'

/* Reads straight off the Tournament entity: overs, ballType, maxTeams, dates. */
const SPEC_ROWS = [
  ['Overs per innings', '10 · 20 · 40 · 50', 'Set per tournament'],
  ['Ball', 'Leather · Tennis', 'Whatever your ground uses'],
  ['Teams', 'Capped by you', 'From four-side cups upward'],
  ['Playing roles', 'Bat · Bowl · All-round · Keep', 'Recorded per player'],
  ['Dates', 'Start and end', 'One weekend or one season'],
]

const STEPS = [
  {
    n: '01',
    title: 'Create your account',
    body: 'Sign up with your playing role, batting style and bowling style. Your player profile is created as you register — there is no second form to fill in.',
  },
  {
    n: '02',
    title: 'Build your squad',
    body: 'Name your team and its captain, leave one contact number, then pull registered players and guests into the squad.',
  },
  {
    n: '03',
    title: 'Enter a tournament',
    body: 'Find a tournament that matches your format and register your side. Organisers see every entry in one list, in the order it arrived.',
  },
]

const SHORT_POINTS = [
  {
    title: 'Accounts that hold up',
    body: 'Sign-in is JWT-backed, passwords are hashed, and access is scoped by role — organisers and players see different things.',
  },
  {
    title: 'One version of the truth',
    body: 'Fixtures, squads and entries sit in one database rather than across four group chats and a photograph of somebody’s notebook.',
  },
]

export default function Home() {
  return (
    <main>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__copy">
            <p className="hero__kicker">For club &amp; local cricket</p>

            <h1 className="hero__title">
              Run the season,
              <br />
              not the spreadsheet.
            </h1>

            <p className="hero__lede">
              CricHub is tournament software for the cricket that actually gets played. Set your
              overs and your ball, register the sides, pick the squads, and keep every entry in
              one place — from the opening fixture to the final ball.
            </p>

            <div className="hero__cta">
              <Link to="/signup" className="btn btn--primary">
                Create an account
              </Link>
              <a href="#how-it-works" className="btn btn--outline">
                How it works
              </a>
            </div>

            <p className="hero__note">Free to start · No card required</p>
          </div>

          <div className="hero__art">
            <Figure
              {...PHOTOS.heroMatch}
              eager
              className="hero__photo"
              caption="Saturday afternoon, and everybody goes up."
            >
              <img
                src={PHOTOS.ball.src}
                alt=""
                aria-hidden="true"
                width="220"
                height="220"
                className="hero__ball"
              />
            </Figure>
          </div>
        </div>
      </section>

      {/* ── Spec strip ────────────────────────────────────────────────────── */}
      <div className="strip">
        <div className="container strip__inner">
          <span>Est. for club cricket</span>
          <span>Tournaments · Teams · Players · Entries</span>
          <span>Spring Boot &amp; React</span>
        </div>
      </div>

      {/* ── What it does ──────────────────────────────────────────────────── */}
      <section className="section" id="features">
        <div className="container">
          <p className="kicker">
            <span className="kicker__n">01</span>
            <span>What it does</span>
          </p>

          <h2 className="section__title">
            The unglamorous half of running cricket, handled.
          </h2>
          <p className="lede">
            Somebody has to chase the entries, count the players and remember who is keeping.
            CricHub does the paperwork so you can get on with picking a side.
          </p>

          <div className="rows">
            <article className="row">
              <Figure
                {...PHOTOS.ground}
                className="row__figure"
                caption="A tournament is a ground, a date, and a number of overs."
              />
              <div className="row__text">
                <h3 className="row__title">Tournaments</h3>
                <p>
                  Set the ground, the start and end dates, the overs per innings, the ball and the
                  number of sides you can take. Run a weekend cup or a season-long league from the
                  same screen.
                </p>
              </div>
            </article>

            <article className="row row--reverse">
              <Figure
                {...PHOTOS.team}
                className="row__figure"
                caption="Eleven names, one captain, one phone number."
              />
              <div className="row__text">
                <h3 className="row__title">Teams &amp; squads</h3>
                <p>
                  Register a side, name its captain, and leave a single contact so an organiser
                  always knows who to ring. Track batting style, bowling style and playing role for
                  every player, and attach them to the squads they turn out for — registered members
                  and guests alike.
                </p>
              </div>
            </article>

            <article className="row">
              <Figure
                {...PHOTOS.groundstaff}
                className="row__figure"
                caption="Entries close long before the roller comes out."
              />
              <div className="row__text">
                <h3 className="row__title">Registrations</h3>
                <p>
                  Teams request a place, organisers confirm it, and every entry stays tied to the
                  tournament it belongs to. No spreadsheet, no pinned message, no argument about who
                  asked first.
                </p>
              </div>
            </article>
          </div>

          <div className="shorts">
            {SHORT_POINTS.map((point) => (
              <div key={point.title} className="short">
                <h3 className="short__title">{point.title}</h3>
                <p>{point.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="section steps-section" id="how-it-works">
        <div className="container steps-section__inner">
          <div>
            <p className="kicker">
              <span className="kicker__n">02</span>
              <span>How it works</span>
            </p>

            <h2 className="section__title">From sign-up to first ball, in three.</h2>

            <ol className="steps">
              {STEPS.map((step) => (
                <li key={step.n} className="step">
                  <span className="step__n">{step.n}</span>
                  <div>
                    <h3 className="step__title">{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <Figure {...PHOTOS.nets} className="steps__figure" caption="Middle of the bat." />
        </div>
      </section>

      {/* ── Formats: a scorecard, not a card grid ─────────────────────────── */}
      <section className="section" id="formats">
        <div className="container">
          <p className="kicker">
            <span className="kicker__n">03</span>
            <span>Formats</span>
          </p>

          <div className="spec">
            <div className="spec__intro">
              <h2 className="section__title">Your ground, your rules.</h2>
              <p className="lede">
                Tape-ball on a school field or leather in a league — a tournament is defined by what
                you set, not by what we assume you play.
              </p>
              <Figure {...PHOTOS.celebrate} className="spec__figure" caption="Two down, none for." />
            </div>

            <table className="spec__table">
              <caption className="visually-hidden">Configurable tournament settings</caption>
              <tbody>
                {SPEC_ROWS.map(([label, value, note]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    <td className="spec__value">{value}</td>
                    <td className="spec__note">{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Closing ───────────────────────────────────────────────────────── */}
      <section className="closing">
        <img
          src={PHOTOS.floodlights.src}
          alt=""
          aria-hidden="true"
          width={PHOTOS.floodlights.width}
          height={PHOTOS.floodlights.height}
          loading="lazy"
          className="closing__bg"
        />
        <div className="container closing__inner">
          <h2 className="closing__title">Get the season organised.</h2>
          <p className="closing__lede">
            Set your first tournament up in an evening. Bring the teams across when you are ready.
          </p>
          <div className="closing__cta">
            <Link to="/signup" className="btn btn--primary">
              Create an account
            </Link>
            <Link to="/login" className="btn btn--onDark">
              I already have one
            </Link>
          </div>
          <p className="closing__credit">
            Photograph{' '}
            <a href={PHOTOS.floodlights.creditHref} target="_blank" rel="noreferrer noopener">
              {PHOTOS.floodlights.credit} / Unsplash
            </a>
          </p>
        </div>
      </section>
    </main>
  )
}
