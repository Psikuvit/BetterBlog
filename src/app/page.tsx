import Link from 'next/link'
import { SessionBadge } from '@/components/session-badge'

export default async function HomePage() {
  return (
    <main className="shell">
      <section className="panel">
        <div className="panel-inner hero">
          <div>
            <span className="brand">
              <span className="brand-mark" />
              BetterBlog
            </span>
            <h1 className="title">Simple pages for testing the app.</h1>
            <p className="lede">
              Use this homepage to verify navigation, authentication, profile updates, and the public user profile flow.
              The pages are intentionally minimal so you can wire data in later without rebuilding the shell.
            </p>

            <div className="actions">
              <SessionBadge />
              <Link className="button-secondary" href="/posts">
                Posts
              </Link>
              <Link className="button-secondary" href="/posts/new">
                New post
              </Link>
              <Link className="button-secondary" href="/activity">
                Activity
              </Link>
            </div>
          </div>

          <aside className="stack">
            <div className="card">
              <h2>What to test</h2>
              <p className="muted">The core flows are now behind auth and available once you sign in.</p>
              <ul>
                <li>Register with username, email, and password</li>
                <li>Login with remember me enabled or disabled</li>
                <li>Browse, create, edit, import, and export posts</li>
                <li>Review admin pages when your account has elevated permissions</li>
              </ul>
            </div>

            <div className="card">
              <h3>Session</h3>
              <SessionBadge />
              <div className="actions">
                <Link className="button-secondary" href="/login">
                  Go to login
                </Link>
                <Link className="button-secondary" href="/register">
                  Create account
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}