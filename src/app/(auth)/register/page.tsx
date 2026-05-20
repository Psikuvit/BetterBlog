'use client'

import { useState } from 'react'
import Link from 'next/link'
import { apiUrl } from '@/utils/api'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const res = await fetch(apiUrl('/api/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    })

    const data = await res.json().catch(() => null)
    setMessage(res.ok ? 'Account created' : data?.error || 'Registration failed')
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
            Register
          </h1>
          <p className="lede">Create a test account to exercise the login and profile update endpoints.</p>

          <form className="form" onSubmit={handleSubmit} style={{ marginTop: 24 }}>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="username">Username</label>
                <input id="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="sam" />
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="sam@example.com" />
              </div>
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" />
            </div>

            <div className="actions">
              <button className="button" type="submit">Create account</button>
              <Link className="button-secondary" href="/login">Back to login</Link>
            </div>
          </form>

          {message ? <p className="notice" style={{ marginTop: 18 }}>{message}</p> : null}
        </div>
      </section>
    </main>
  )
}