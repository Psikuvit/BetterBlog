'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiUrl } from '@/utils/api'
import { authFetch, getAuthErrorMessage } from '@/utils/auth'
import type { APIToken } from '@/types'

function isAPIToken(value: unknown): value is APIToken {
  return typeof value === 'object' && value !== null && 'id' in value
}

export default function TokensPage() {
  const [tokens, setTokens] = useState<APIToken[]>([])
  const [showNewForm, setShowNewForm] = useState(false)
  const [tokenName, setTokenName] = useState('')
  const [selectedScopes, setSelectedScopes] = useState<string[]>([])
  const [expiresIn, setExpiresIn] = useState('90d')
  const [createdToken, setCreatedToken] = useState<{ name: string; token: string } | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const scopeOptions = [
    { value: 'posts:read', label: 'Read posts' },
    { value: 'posts:create', label: 'Create posts' },
    { value: 'posts:edit', label: 'Edit posts' },
    { value: 'posts:delete', label: 'Delete posts' },
    { value: 'posts:export', label: 'Export posts' },
    { value: 'posts:import', label: 'Import posts' },
    { value: 'sharing:manage', label: 'Manage sharing links' },
    { value: 'tokens:manage', label: 'Manage API tokens' },
    { value: 'profile:read', label: 'Read profile' },
  ]

  useEffect(() => {
    const loadTokens = async () => {
      setLoading(true)
      try {
        const response = await authFetch(apiUrl('/api/tokens'))
        const data = await response.json().catch(() => null)
        if (!response.ok) {
          setMessage(getAuthErrorMessage(data, 'Failed to load tokens'))
          setTokens([])
          return
        }
        setTokens(Array.isArray(data?.tokens) ? data.tokens.filter(isAPIToken) : [])
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Failed to load tokens')
      } finally {
        setLoading(false)
      }
    }
    loadTokens()
  }, [])

  const handleCreateToken = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!tokenName || selectedScopes.length === 0) {
      setMessage('Name and at least one scope required')
      return
    }

    setCreating(true)
    try {
      const response = await authFetch(apiUrl('/api/tokens'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tokenName,
          scopes: selectedScopes,
          expiresIn,
        }),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        setMessage(getAuthErrorMessage(data, 'Failed to create token'))
        return
      }

      if (!data?.token || typeof data.token !== 'object' || !('id' in data.token)) {
        setMessage('Token created, but the response was missing token details.')
        return
      }

      setCreatedToken(data.token)
      setTokens([...tokens, data.token])
      setTokenName('')
      setSelectedScopes([])
      setExpiresIn('90d')
      setShowNewForm(false)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error creating token')
    } finally {
      setCreating(false)
    }
  }

  const handleRevokeToken = async (tokenId: string) => {
    if (!confirm('Revoke this token?')) return

    try {
      const response = await authFetch(apiUrl(`/api/tokens/${tokenId}`), {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setMessage(getAuthErrorMessage(data, 'Failed to revoke token'))
        return
      }

      setTokens(tokens.filter((t) => t.id !== tokenId))
      setMessage('Token revoked')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error revoking token')
    }
  }

  const toggleScope = (scope: string) => {
    setSelectedScopes((current) =>
      current.includes(scope) ? current.filter((s) => s !== scope) : [...current, scope]
    )
  }

  return (
    <main className="shell">
      <section className="panel" style={{ width: 'min(100%, 960px)' }}>
        <div className="panel-inner">
          <div className="page-head">
            <div>
              <span className="brand">
                <span className="brand-mark" />
                BetterBlog
              </span>
              <h1 className="page-title">API Tokens</h1>
              <p className="lede">Generate and manage personal API tokens for programmatic access.</p>
            </div>
            <div className="actions">
              <Link className="button-secondary" href="/settings">
                Back to settings
              </Link>
            </div>
          </div>

          {message ? <div className="notice" style={{ marginTop: 16 }}>{message}</div> : null}

          {createdToken ? (
            <div className="card" style={{ marginTop: 16, backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)' }}>
              <h3>Token Created! 🎉</h3>
              <p className="muted">Copy your token now. You won`t be able to see it again:</p>
              <code
                style={{
                  display: 'block',
                  padding: 12,
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  borderRadius: 8,
                  marginTop: 12,
                  wordBreak: 'break-all',
                  fontSize: '0.85em',
                }}
              >
                {createdToken.token}
              </code>
              <button
                className="button"
                onClick={() => {
                  navigator.clipboard.writeText(createdToken.token)
                  setMessage('Token copied to clipboard')
                  setCreatedToken(null)
                }}
                style={{ marginTop: 12 }}
              >
                Copy to Clipboard
              </button>
            </div>
          ) : null}

          <div className="split" style={{ marginTop: 18 }}>
            <div className="stack-tight">
              {showNewForm && (
                <div className="card">
                  <h2 style={{ marginTop: 0 }}>Create New Token</h2>
                  <form onSubmit={handleCreateToken} className="form">
                    <div className="field">
                      <label htmlFor="tokenName">Token Name</label>
                      <input
                        id="tokenName"
                        value={tokenName}
                        onChange={(e) => setTokenName(e.target.value)}
                        placeholder="My API Token"
                        required
                      />
                    </div>

                    <div className="field">
                      <label>Scopes</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginTop: 8 }}>
                        {scopeOptions.map((option) => (
                          <label key={option.value} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input
                              type="checkbox"
                              checked={selectedScopes.includes(option.value)}
                              onChange={() => toggleScope(option.value)}
                            />
                            {option.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="field">
                      <label htmlFor="expiresIn">Expires In</label>
                      <select
                        id="expiresIn"
                        value={expiresIn}
                        onChange={(e) => setExpiresIn(e.target.value)}
                      >
                        <option value="7d">7 days</option>
                        <option value="30d">30 days</option>
                        <option value="90d">90 days</option>
                        <option value="1y">1 year</option>
                      </select>
                    </div>

                    <div className="actions">
                      <button className="button" type="submit" disabled={creating || !tokenName || selectedScopes.length === 0}>
                        {creating ? 'Creating...' : 'Create Token'}
                      </button>
                      <button
                        className="button-secondary"
                        type="button"
                        onClick={() => {
                          setShowNewForm(false)
                          setTokenName('')
                          setSelectedScopes([])
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {!showNewForm && (
                <div className="card">
                  <h2 style={{ marginTop: 0 }}>Create New Token</h2>
                  <button className="button" onClick={() => setShowNewForm(true)}>
                    Generate Token
                  </button>
                </div>
              )}
            </div>

            <div className="stack-tight">
              <div className="card">
                <h2 style={{ marginTop: 0 }}>Your Tokens ({tokens.length})</h2>
                {loading ? (
                  <p className="muted">Loading tokens...</p>
                ) : tokens.length === 0 ? (
                  <p className="muted">No API tokens yet.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(30, 27, 24, 0.12)' }}>
                          <th style={{ textAlign: 'left', padding: 8 }}>Name</th>
                          <th style={{ textAlign: 'left', padding: 8 }}>Scopes</th>
                          <th style={{ textAlign: 'left', padding: 8 }}>Created</th>
                          <th style={{ textAlign: 'left', padding: 8 }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tokens.map((token) => (
                          <tr key={token.id} style={{ borderBottom: '1px solid rgba(30, 27, 24, 0.12)' }}>
                            <td style={{ padding: 8 }}>{token.name}</td>
                            <td style={{ padding: 8 }}>
                              {token.scopes.map((scope) => (
                                <span key={scope} className="chip" style={{ marginRight: 4, marginBottom: 4 }}>
                                  {scope}
                                </span>
                              ))}
                            </td>
                            <td style={{ padding: 8 }}>
                              <span className="muted" style={{ fontSize: '0.9em' }}>
                                {new Date(token.createdAt).toLocaleDateString()}
                              </span>
                            </td>
                            <td style={{ padding: 8 }}>
                              <button
                                className="button-secondary"
                                style={{ fontSize: '0.85em', padding: '4px 8px' }}
                                onClick={() => handleRevokeToken(token.id)}
                              >
                                Revoke
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
