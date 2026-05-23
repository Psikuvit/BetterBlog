import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="shell">
      <section className="panel">
        <div className="panel-inner">
          <h1>Profile not found</h1>
          <p className="muted">We couldn't find that user profile.</p>
          <div className="actions">
            <Link className="button" href="/">Home</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
