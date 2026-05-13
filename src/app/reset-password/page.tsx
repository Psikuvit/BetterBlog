'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const requestReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const res = await fetch('/api/auth/password-reset/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json().catch(() => null)
    setToken(data?.resetToken || '')
    setMessage(res.ok ? 'Reset requested' : data?.error || 'Request failed')
  }

  const confirmReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const res = await fetch('/api/auth/password-reset/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    const data = await res.json().catch(() => null)
    setMessage(res.ok ? 'Password updated' : data?.error || 'Confirm failed')
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
          <p className="lede">In development, the request endpoint returns a token so you can test the whole flow locally.</p>

          <div className="grid-2" style={{ marginTop: 24 }}>
            <form className="form" onSubmit={requestReset}>
              <h2>1. Request token</h2>
              <div className="field">
                <label htmlFor="reset-email">Email</label>
                <input id="reset-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="sam@example.com" />
              </div>
              <button className="button" type="submit">Request reset</button>
            </form>

            <form className="form" onSubmit={confirmReset}>
              <h2>2. Confirm token</h2>
              <div className="field">
                <label htmlFor="reset-token">Token</label>
                <input id="reset-token" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Paste token here" />
              </div>
              <div className="field">
                <label htmlFor="new-password">New password</label>
                <input id="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password" />
              </div>
              <button className="button" type="submit">Set new password</button>
            </form>
          </div>

          <div className="actions" style={{ marginTop: 18 }}>
            <Link className="button-secondary" href="/login">Back to login</Link>
            <Link className="button-secondary" href="/">Home</Link>
          </div>

          {message ? <p className="notice" style={{ marginTop: 18 }}>{message}</p> : null}
        </div>
      </section>
    </main>
  )
}