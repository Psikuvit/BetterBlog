import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="shell">
      <section className="panel">
        <div className="panel-inner">
          <h1>Posts not found</h1>
          <p className="muted">We couldn't find the posts you're looking for.</p>
          <div className="actions">
            <Link className="button" href="/posts/new">Create a new post</Link>
            <Link className="button-secondary" href="/">Home</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
