"use client"
import { useState } from 'react'
import { login, logout, getAccessToken, startAutoRefresh } from '../../../utils/clientAuth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [msg, setMsg] = useState('')

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
    <main style={{fontFamily: 'system-ui, sans-serif', padding: 24}}>
      <h1>Login (route group: (auth))</h1>
      <form onSubmit={handleLogin} style={{display: 'grid', gap: 8, maxWidth: 360}}>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <label style={{display: 'flex', alignItems: 'center', gap: 8}}>
          <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
          Remember me for 30 days
        </label>
        <button type="submit">Login</button>
      </form>
      <div style={{marginTop: 12}}>
        <button onClick={() => { startAutoRefresh(); setMsg('Auto-refresh started') }}>Start Auto Refresh</button>
        <button onClick={handleLogout} style={{marginLeft: 8}}>Logout</button>
      </div>
      <p style={{marginTop: 12}}>Access token: {typeof window !== 'undefined' ? getAccessToken() : 'n/a'}</p>
      <p>{msg}</p>
    </main>
  )
}
