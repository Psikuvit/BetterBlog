import Link from 'next/link'
import type { ProfilePageProps } from '@/types'

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params

  return (
    <main className="shell">
      <section className="panel" style={{ width: 'min(100%, 760px)' }}>
        <div className="panel-inner">
          <span className="brand">
            <span className="brand-mark" />
            BetterBlog
          </span>
          <h1 className="title" style={{ fontSize: 'clamp(2rem, 5vw, 3.4rem)' }}>
            @{username}
          </h1>
          <p className="lede">
            This is a simple placeholder public profile page. Once you have real user data, this route can fetch from
            <code> /api/users/{username}</code> and render the public posts list.
          </p>

          <div className="card" style={{ marginTop: 24 }}>
            <h2>Public profile shell</h2>
            <p className="muted">Use this route to confirm the UI and routing are working before wiring live data.</p>
          </div>

          <div className="actions" style={{ marginTop: 18 }}>
            <Link className="button-secondary" href="/">Home</Link>
            <Link className="button-secondary" href="/login">Login</Link>
          </div>
        </div>
      </section>
    </main>
  )
}