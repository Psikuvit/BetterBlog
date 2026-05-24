'use client'

import { useState } from 'react'
import Link from 'next/link'
import { apiUrl } from '@/utils/api'
import { debugFetch, getAuthErrorMessage } from '@/utils/auth'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const requestReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email.trim() || !code.trim() || !password) {
      setMessage('Email, reset code, and new password are required.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await debugFetch(apiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
          newPassword: password,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setMessage(getAuthErrorMessage(data, 'Reset failed'))
        return
      }

      setMessage(data?.message || 'Password reset successful')
      setCode('')
      setPassword('')
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Reset failed')
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
            Reset password
          </h1>
          <p className="lede">Enter the email, 6-digit code, and new password that the backend contract expects.</p>

          <div className="grid-2" style={{ marginTop: 24 }}>
            <form className="form" onSubmit={requestReset}>
              <h2>Reset password</h2>
              <div className="field">
                <label htmlFor="reset-email">Email</label>
                <input id="reset-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="sam@example.com" required />
              </div>
              <div className="field">
                <label htmlFor="reset-code">Reset code</label>
                <input id="reset-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} placeholder="123456" required />
              </div>
              <div className="field">
                <label htmlFor="new-password">New password</label>
                <input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New secure password" required />
              </div>
              <button className="button" type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Set new password'}
              </button>
            </form>
          </div>

          <div className="actions" style={{ marginTop: 18 }}>
            <Link className="button-secondary" href="/forgot-password">Request a code</Link>
            <Link className="button-secondary" href="/login">Back to login</Link>
            <Link className="button-secondary" href="/">Home</Link>
          </div>

          {message ? <p className="notice" style={{ marginTop: 18 }}>{message}</p> : null}
        </div>
      </section>
    </main>
  )
}