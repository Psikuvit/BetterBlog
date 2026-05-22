"use client"
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { apiUrl } from '@/utils/api'
import { setAuthSession } from '@/utils/auth'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const redirectTo = searchParams.get('redirect') || '/posts'

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setMsg(data?.error || 'Login failed')
        return
      }

      setAuthSession(data?.token, data?.refreshToken, rememberMe)
      router.replace(redirectTo)
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
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
          <p className="lede">Sign in with your email and password. Authentication will be handled by the Spring Boot backend.</p>

          <form className="form" onSubmit={handleLogin} style={{ marginTop: 24 }}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" autoComplete="email" placeholder="sam@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" autoComplete="current-password" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
              Remember me for 30 days
            </label>

            <div className="actions">
              <button className="button" type="submit" disabled={loading}>
                {loading ? 'Loading...' : 'Login'}
              </button>
              <Link className="button-secondary" href="/register">
                Register
              </Link>
            </div>
          </form>

          <div className="card" style={{ marginTop: 18 }}>
            <h2>Session</h2>
            <p className="muted">Protected routes now require a verified session token.</p>
            {msg ? <p className="notice" style={{ marginTop: 12 }}>{msg}</p> : null}
          </div>
        </div>
      </section>
    </main>
  )
}
