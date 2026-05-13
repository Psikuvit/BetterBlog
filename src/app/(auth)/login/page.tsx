"use client"
import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/auth-context'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [msg, setMsg] = useState('')
  const { user, loading, login, logout, isAuthenticated } = useAuth()

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      await login(email, password, rememberMe)
      setMsg('Logged in')
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Error')
    }
  }

  const handleLogout = async () => {
    await logout()
    setMsg('Logged out')
  }

  return (
    <main className="shell">
      <section className="panel" style={{ width: 'min(100%, 560px)' }}>
        <div className="panel-inner">
          <span className="brand">
            <span className="brand-mark" />
            BetterBlog
          </span>
          <h1 className="title" style={{ fontSize: 'clamp(2rem, 5vw, 3.4rem)' }}>
            Login
          </h1>
          <p className="lede">Sign in once and the auth provider keeps the session state available to the rest of the app.</p>

          <form className="form" onSubmit={handleLogin} style={{ marginTop: 24 }}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" placeholder="sam@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
              Remember me for 30 days
            </label>

            <div className="actions">
              <button className="button" type="submit" disabled={loading}>
                {loading ? 'Loading...' : 'Login'}
              </button>
              <button className="button-secondary" type="button" onClick={handleLogout} disabled={!isAuthenticated}>
                Logout
              </button>
              <Link className="button-secondary" href="/register">
                Register
              </Link>
            </div>
          </form>

          <div className="card" style={{ marginTop: 18 }}>
            <h2>Session</h2>
            <p className="muted">{user ? `Signed in as @${user.username}` : 'No active session'}</p>
            {msg ? <p className="notice" style={{ marginTop: 12 }}>{msg}</p> : null}
          </div>
        </div>
      </section>
    </main>
  )
}
