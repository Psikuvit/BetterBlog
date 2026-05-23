import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="shell">
      <section className="panel">
        <div className="panel-inner">
          <h1>Settings not found</h1>
          <p className="muted">We couldn't find this settings page.</p>
          <div className="actions">
            <Link className="button" href="/settings">Settings home</Link>
            <Link className="button-secondary" href="/">Home</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
