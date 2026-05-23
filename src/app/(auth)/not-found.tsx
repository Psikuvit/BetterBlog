import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="shell">
      <section className="panel">
        <div className="panel-inner">
          <h1>Not found</h1>
          <p className="muted">The page you are looking for isn't here.</p>
          <div className="actions">
            <Link className="button" href="/">Home</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
