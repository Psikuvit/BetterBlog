"use client"
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { apiUrl } from '@/utils/api'
import { debugFetch, setAuthSession } from '@/utils/auth'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [rememberMe, setRememberMe] = useState(false)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const redirectTo = searchParams.get('redirect') || '/posts'

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const identifier = String(formData.get('identifier') ?? '').trim()
    const password = String(formData.get('password') ?? '')
    const rememberMeValue = formData.get('rememberMe') === 'on'

    if (!identifier || !password) {
      setMsg('Enter an email or username and password')
      return
    }

    setLoading(true)
    setMsg('')
    try {
      const response = await debugFetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: identifier,
          username: identifier,
          password,
          rememberMe: rememberMeValue,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setMsg(data?.error || 'Login failed')
        return
      }

      const accessToken = data?.token ?? data?.accessToken ?? data?.jwt ?? data?.access_token
      const refreshToken = data?.refreshToken ?? data?.refresh_token

      if (!accessToken) {
        setMsg('Login succeeded, but the backend did not return an access token')
        return
      }

      setAuthSession(String(accessToken), refreshToken ? String(refreshToken) : undefined, rememberMeValue)
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
              <label htmlFor="identifier">Email or username</label>
              <input id="identifier" name="identifier" autoComplete="username" placeholder="sam@example.com or sam" required />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" autoComplete="current-password" placeholder="Password" type="password" required />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input name="rememberMe" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
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
