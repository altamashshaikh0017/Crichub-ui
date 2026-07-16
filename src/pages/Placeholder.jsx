import { Link } from 'react-router-dom'

export default function Placeholder({ title, body = 'This screen is coming next.' }) {
  return (
    <main className="container section" style={{ minHeight: '54vh' }}>
      <p className="kicker">
        <span className="kicker__n">—</span>
        <span>CricHub</span>
      </p>
      <h1 className="section__title">{title}</h1>
      <p className="lede">{body}</p>
      <Link to="/" className="btn btn--outline" style={{ marginTop: 32 }}>
        Back to home
      </Link>
    </main>
  )
}
