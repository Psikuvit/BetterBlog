import Link from 'next/link'
import { SessionBadge } from '@/components/session-badge'

const primaryLinks = [
  { href: '/posts', label: 'Posts', description: 'Browse and manage posts' },
  { href: '/posts/new', label: 'New post', description: 'Create a new article' },
  { href: '/activity', label: 'Activity', description: 'Review your activity log' },
  { href: '/settings/sharing', label: 'Sharing', description: 'Manage share links' },
  { href: '/settings/tokens', label: 'Tokens', description: 'Manage API tokens' },
  { href: '/login', label: 'Login', description: 'Sign in to your account' },
  { href: '/register', label: 'Register', description: 'Create a new account' },
  { href: '/reset-password', label: 'Reset password', description: 'Recover your account access' },
]

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
              <Link className="button" href="/admin">
                Admin
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
              <h3>Quick links</h3>
              <div className="stack-tight">
                {primaryLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="button-secondary" style={{ justifyContent: 'space-between' }}>
                    <span>{link.label}</span>
                    <span className="muted" style={{ fontSize: '0.85em' }}>{link.description}</span>
                  </Link>
                ))}
              </div>
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