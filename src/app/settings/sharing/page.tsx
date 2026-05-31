'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiUrl } from '@/utils/api'
import { authFetch, getAuthErrorMessage } from '@/utils/auth'
import type { SharedPost, TemporaryLink } from '@/types'

function isTemporaryLink(value: unknown): value is TemporaryLink {
  return typeof value === 'object' && value !== null && 'id' in value
}

function isPost(value: unknown): value is SharedPost {
  return typeof value === 'object' && value !== null && 'id' in value
}

export default function SharingPage() {
  const [links, setLinks] = useState<TemporaryLink[]>([])
  const [posts, setPosts] = useState<SharedPost[]>([])
  const [selectedPostId, setSelectedPostId] = useState('')
  const [expiresIn, setExpiresIn] = useState('7d')
  const [maxAccess, setMaxAccess] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [linksRes, postsRes] = await Promise.all([
          authFetch(apiUrl('/api/sharing/links')),
          authFetch(apiUrl('/api/posts?limit=100')),
        ])
        const linksData = await linksRes.json().catch(() => null)
        const postsData = await postsRes.json().catch(() => null)

        if (!linksRes.ok || !postsRes.ok) {
          setMessage(getAuthErrorMessage(linksData || postsData, 'Failed to load data'))
          return
        }

        setLinks(Array.isArray(linksData?.links) ? linksData.links.filter(isTemporaryLink) : [])
        setPosts(Array.isArray(postsData?.posts) ? postsData.posts.filter(isPost) : [])
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleCreateLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedPostId) {
      setMessage('Please select a post')
      return
    }

    setCreating(true)
    try {
      const response = await authFetch(apiUrl('/api/sharing/links'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: selectedPostId,
          expiresIn,
          ...(maxAccess ? { maxAccess: Number(maxAccess) } : {}),
        }),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        setMessage(getAuthErrorMessage(data, 'Failed to create link'))
        return
      }

      if (!data?.link || typeof data.link !== 'object' || !('id' in data.link)) {
        setMessage('Link created, but the response was missing link details.')
        return
      }

      setLinks([...links, data.link])
      setSelectedPostId('')
      setExpiresIn('7d')
      setMaxAccess('')
      setMessage('Link created successfully')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error creating link')
    } finally {
      setCreating(false)
    }
  }

  const handleRevokeLink = async (linkId: string) => {
    if (!confirm('Revoke this link?')) return

    try {
      const response = await authFetch(apiUrl(`/api/sharing/links/${linkId}`), {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setMessage(getAuthErrorMessage(data, 'Failed to revoke link'))
        return
      }

      setLinks(links.filter((l) => l.id !== linkId))
      setMessage('Link revoked')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error revoking link')
    }
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
              <h1 className="page-title">Sharing & Access Links</h1>
              <p className="lede">Create temporary shareable links for your posts, including private content.</p>
            </div>
            <div className="actions">
              <Link className="button-secondary" href="/settings">
                Back to settings
              </Link>
            </div>
          </div>

          {message ? <div className="notice" style={{ marginTop: 16 }}>{message}</div> : null}

          <div className="split" style={{ marginTop: 18 }}>
            <div className="stack-tight">
              <div className="card">
                <h2 style={{ marginTop: 0 }}>Create New Link</h2>
                <form onSubmit={handleCreateLink} className="form">
                  <div className="field">
                    <label htmlFor="post">Select Post</label>
                    <select
                      id="post"
                      value={selectedPostId}
                      onChange={(e) => setSelectedPostId(e.target.value)}
                      required
                    >
                      <option value="">Choose a post...</option>
                      {posts.map((post) => (
                        <option key={post.id} value={post.id}>
                          {post.title} ({post.visibility})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid-2">
                    <div className="field">
                      <label htmlFor="expiresIn">Expires In</label>
                      <select
                        id="expiresIn"
                        value={expiresIn}
                        onChange={(e) => setExpiresIn(e.target.value)}
                      >
                        <option value="1h">1 hour</option>
                        <option value="1d">1 day</option>
                        <option value="7d">7 days</option>
                        <option value="30d">30 days</option>
                        <option value="90d">90 days</option>
                      </select>
                    </div>

                    <div className="field">
                      <label htmlFor="maxAccess">Max Access Count (optional)</label>
                      <input
                        id="maxAccess"
                        type="number"
                        min="1"
                        value={maxAccess}
                        onChange={(e) => setMaxAccess(e.target.value)}
                        placeholder="Unlimited"
                      />
                    </div>
                  </div>

                  <div className="actions">
                    <button className="button" type="submit" disabled={creating || !selectedPostId}>
                      {creating ? 'Creating...' : 'Create Link'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="stack-tight">
              <div className="card">
                <h2 style={{ marginTop: 0 }}>Your Links ({links.length})</h2>
                {loading ? (
                  <p className="muted">Loading links...</p>
                ) : links.length === 0 ? (
                  <p className="muted">No sharing links yet.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(30, 27, 24, 0.12)' }}>
                          <th style={{ textAlign: 'left', padding: 8 }}>Post</th>
                          <th style={{ textAlign: 'left', padding: 8 }}>Expires</th>
                          <th style={{ textAlign: 'left', padding: 8 }}>Accesses</th>
                          <th style={{ textAlign: 'left', padding: 8 }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {links.map((link) => (
                          <tr key={link.id} style={{ borderBottom: '1px solid rgba(30, 27, 24, 0.12)' }}>
                            <td style={{ padding: 8 }}>
                              <code style={{ fontSize: '0.85em' }}>{link.postId.slice(0, 8)}</code>
                            </td>
                            <td style={{ padding: 8 }}>
                              <span className="muted" style={{ fontSize: '0.9em' }}>
                                {new Date(link.expiresAt).toLocaleDateString()}
                              </span>
                            </td>
                            <td style={{ padding: 8 }}>
                              {link.accessCount} {link.maxAccess ? `/ ${link.maxAccess}` : ''}
                            </td>
                            <td style={{ padding: 8 }}>
                              <button
                                className="button-secondary"
                                style={{ fontSize: '0.85em', padding: '4px 8px' }}
                                onClick={() => handleRevokeLink(link.id)}
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
