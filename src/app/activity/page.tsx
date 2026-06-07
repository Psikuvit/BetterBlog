'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiUrl } from '@/utils/api'
import { authFetch, getAuthErrorMessage } from '@/utils/auth'
import type { ActivityLog } from '@/types'

function isActivityLog(value: unknown): value is ActivityLog {
  return typeof value === 'object' && value !== null && 'id' in value
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const actionColors: Record<string, string> = {
    login: 'rgba(59, 130, 246, 0.2)',
    logout: 'rgba(107, 114, 128, 0.2)',
    create: 'rgba(34, 197, 94, 0.2)',
    update: 'rgba(251, 146, 60, 0.2)',
    delete: 'rgba(239, 68, 68, 0.2)',
    export: 'rgba(168, 85, 247, 0.2)',
    import: 'rgba(59, 130, 246, 0.2)',
  }

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', (page - 1).toString())
        if (filter !== 'all') params.set('action', filter)
        const response = await authFetch(apiUrl(`/api/activity${params.toString() ? `?${params.toString()}` : ''}`))
        const data = await response.json().catch(() => null)

        if (!response.ok) {
          console.error('Failed to load activity logs:', getAuthErrorMessage(data, 'Failed to load activity logs'))
          setLogs([])
          setTotalPages(1)
          return
        }

        setLogs(Array.isArray(data?.content) ? data.content.filter(isActivityLog) : [])
        setTotalPages(data?.totalPages || 1)
      } catch (error) {
        console.error('Failed to load activity logs:', error)
      } finally {
        setLoading(false)
      }
    }
    loadLogs()
  }, [filter, page])

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      login: 'Logged in',
      logout: 'Logged out',
      post_create: 'Created post',
      post_update: 'Updated post',
      post_delete: 'Deleted post',
      post_publish: 'Published post',
      import: 'Imported posts',
      export: 'Exported posts',
      sharing_create: 'Created sharing link',
      sharing_revoke: 'Revoked sharing link',
      token_create: 'Created API token',
      token_revoke: 'Revoked API token',
    }
    return labels[action] || action
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
              <h1 className="page-title">Activity Log</h1>
              <p className="lede">View your account activity and security events.</p>
            </div>
            <div className="actions">
              <Link className="button-secondary" href="/settings">
                Back to settings
              </Link>
            </div>
          </div>

          <div className="card" style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value)
                  setPage(1)
                }}
                style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid rgba(30, 27, 24, 0.12)' }}
              >
                <option value="all">All events</option>
                <option value="login">Logins</option>
                <option value="post_create">Post creation</option>
                <option value="post_update">Post updates</option>
                <option value="post_delete">Post deletion</option>
                <option value="import">Imports</option>
                <option value="export">Exports</option>
                <option value="sharing">Sharing links</option>
                <option value="token">API tokens</option>
              </select>
            </div>

            {loading ? (
              <p className="muted">Loading activity...</p>
            ) : logs.length === 0 ? (
              <p className="muted">No activity to display.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {logs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: 12,
                      backgroundColor: actionColors[log.action.split('_')[0]] || 'rgba(107, 114, 128, 0.1)',
                      borderRadius: 8,
                      borderLeft: '4px solid rgba(30, 27, 24, 0.2)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div>
                        <strong>{getActionLabel(log.action)}</strong>
                        {log.resourceName ? (
                          <p className="muted" style={{ margin: '4px 0 0 0', fontSize: '0.9em' }}>
                            {log.resourceType}: {log.resourceName}
                          </p>
                        ) : null}
                        {log.details ? (
                          <details style={{ marginTop: 8, fontSize: '0.85em' }}>
                            <summary className="muted">Details</summary>
                            <pre style={{ marginTop: 8, fontSize: '0.8em', overflow: 'auto' }}>
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        ) : null}
                      </div>
                      <span className="muted" style={{ fontSize: '0.85em', whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="button-secondary"
                  style={{ padding: '4px 8px' }}
                >
                  Previous
                </button>
                <span style={{ alignSelf: 'center', marginTop: 2 }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="button-secondary"
                  style={{ padding: '4px 8px' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
