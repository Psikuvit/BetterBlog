import { cookies } from 'next/headers'
import Image from 'next/image'
import Link from 'next/link'
import { apiUrl } from '@/utils/api'
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/utils/auth'

type CurrentUser = {
  username?: string | null
  avatarUrl?: string | null
  displayName?: string | null
  email?: string | null
}

async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value || cookieStore.get(REFRESH_TOKEN_COOKIE)?.value

  if (!token) {
    return null
  }

  try {
    const response = await fetch(apiUrl('/api/auth/me'), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json().catch(() => null)
    return data?.user ?? null
  } catch {
    return null
  }
}

export default async function HomePage() {
  const user = await getCurrentUser()
  const avatarLabel = user?.displayName || user?.username || 'Member'
  const avatarInitials = avatarLabel
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

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
              {user ? (
                <span
                  className="button-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 10, pointerEvents: 'none' }}
                  aria-label={`Logged in as ${avatarLabel}`}
                >
                  {user.avatarUrl ? (
                    <Image src={user.avatarUrl} alt={avatarLabel} width={24} height={24} style={{ borderRadius: 9999, objectFit: 'cover' }} />
                  ) : (
                    <span
                      aria-hidden="true"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 24,
                        height: 24,
                        borderRadius: 9999,
                        background: 'rgba(30, 27, 24, 0.12)',
                        color: 'inherit',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {avatarInitials || 'M'}
                    </span>
                  )}
                  <span>
                    {avatarLabel}
                    <span className="muted" style={{ marginLeft: 8 }}>
                      Online
                    </span>
                  </span>
                </span>
              ) : null}
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
              <p className="muted">{user ? `Signed in as ${avatarLabel}` : 'No active session detected.'}</p>
              <div className="actions">
                <Link className="button-secondary" href="/login">
                  {user ? 'Refresh session' : 'Go to login'}
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