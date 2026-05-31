import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="shell">
      <section className="panel">
        <div className="panel-inner">
          <h1>Admin area not found</h1>
          <p className="muted">That admin page doesn&apos;t exist or you don&apos;t have access.</p>
          <div className="actions">
            <Link className="button" href="/admin">Admin home</Link>
            <Link className="button-secondary" href="/">Home</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
