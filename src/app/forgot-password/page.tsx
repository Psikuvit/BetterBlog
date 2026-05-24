'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { apiUrl } from '@/utils/api'
import { debugFetch, getAuthErrorMessage } from '@/utils/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)

    return () => window.clearInterval(timer)
  }, [])

  const cooldownRemaining = useMemo(() => {
    if (!cooldownUntil) {
      return 0
    }

    return Math.max(0, Math.ceil((cooldownUntil - now) / 1000))
  }, [cooldownUntil, now])

  const requestReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email.trim()) {
      setMessage('Enter your email address.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await debugFetch(apiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setMessage(getAuthErrorMessage(data, 'Unable to request a reset code'))
        return
      }

      const expiresInMinutes = Number(data?.expiresInMinutes) || 30
      setCooldownUntil(Date.now() + 60_000)
      setMessage(`If the email exists, a reset code has been sent. The code expires in ${expiresInMinutes} minutes.`)
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="shell">
      <section className="panel" style={{ width: 'min(100%, 760px)' }}>
        <div className="panel-inner">
          <span className="brand">
            <span className="brand-mark" />
            BetterBlog
          </span>
          <h1 className="title" style={{ fontSize: 'clamp(2rem, 5vw, 3.4rem)' }}>
            Forgot password
          </h1>
          <p className="lede">Request a reset code. The response is intentionally vague so email addresses are not enumerated.</p>

          <form className="form" onSubmit={requestReset} style={{ marginTop: 24, maxWidth: 520 }}>
            <div className="field">
              <label htmlFor="forgot-email">Email</label>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="sam@example.com"
                required
              />
            </div>

            <div className="actions">
              <button className="button" type="submit" disabled={loading || cooldownRemaining > 0}>
                {loading ? 'Sending...' : cooldownRemaining > 0 ? `Wait ${cooldownRemaining}s` : 'Send reset code'}
              </button>
              <Link className="button-secondary" href="/reset-password">
                I already have a code
              </Link>
              <Link className="button-secondary" href="/login">
                Back to login
              </Link>
            </div>
          </form>

          <div className="card" style={{ marginTop: 18 }}>
            <h2>What happens next</h2>
            <p className="muted">You’ll receive a 6-digit code by email. It stays valid for 30 minutes.</p>
            {message ? <p className="notice" style={{ marginTop: 12 }}>{message}</p> : null}
          </div>
        </div>
      </section>
    </main>
  )
}