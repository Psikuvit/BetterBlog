import Link from 'next/link'

const testProfiles = ['alice', 'sam', 'jordan']

export default function HomePage() {
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
              <Link className="button" href="/login">
                Go to login
              </Link>
              <Link className="button-secondary" href="/register">
                Create account
              </Link>
              <Link className="button-secondary" href="/posts">
                Posts
              </Link>
              <Link className="button-secondary" href="/posts/new">
                New post
              </Link>
              <Link className="button-secondary" href="/reset-password">
                Reset password
              </Link>
            </div>
          </div>

          <aside className="stack">
            <div className="card">
              <h2>What to test</h2>
              <p className="muted">The core flows already in the API now have basic UI entry points.</p>
              <ul>
                <li>Register with username, email, and password</li>
                <li>Login with remember me enabled or disabled</li>
                <li>Request a password reset token</li>
                <li>Open public profiles at /profile/[username]</li>
                <li>Browse, create, edit, import, and export posts</li>
              </ul>
            </div>

            <div className="card">
              <h3>Sample profiles</h3>
              <p className="muted">These are simple route targets you can use for manual testing.</p>
              <div className="actions">
                {testProfiles.map((username) => (
                  <Link key={username} className="button-secondary" href={`/profile/${username}`}>
                    /profile/{username}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}