'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { apiUrl } from '@/utils/api'
import { adminFetch, getAdminAccessToken, getAdminErrorMessage } from '@/utils/admin-auth'
import type { AdminActivityLog } from '@/types'

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<AdminActivityLog[]>([])
  const [severity, setSeverity] = useState('')
  const [username, setUsername] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const pathname = usePathname()

  const severityColors: Record<string, string> = {
    info: 'rgba(59, 130, 246, 0.2)',
    warning: 'rgba(251, 146, 60, 0.2)',
    critical: 'rgba(239, 68, 68, 0.2)',
  }

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true)

      if (!getAdminAccessToken()) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
        return
      }

      try {
        const params = new URLSearchParams()
        params.set('page', page.toString())
        if (severity) params.set('severity', severity)
        if (username) params.set('username', username)
        const response = await adminFetch(apiUrl(`/api/admin/activity${params.toString() ? `?${params.toString()}` : ''}`))
        const data = await response.json().catch(() => null)

        if (response.status === 401) {
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
          return
        }

        if (!response.ok) {
          setMessage(getAdminErrorMessage(response, data))
          setLogs([])
          setTotalPages(1)
          return
        }

        setLogs(Array.isArray(data?.logs) ? data.logs : [])
        setTotalPages(data?.totalPages || 1)
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Failed to load activity logs')
      } finally {
        setLoading(false)
      }
    }
    loadLogs()
  }, [severity, username, page, pathname, router])

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      post_made_private: 'Post made private',
      post_made_public: 'Post made public',
      post_deleted: 'Post deleted',
      user_promoted: 'User promoted',
      moderator_removed: 'Moderator removed',
      config_updated: 'Config updated',
      admin_login: 'Admin login',
      user_banned: 'User banned',
    }
    return labels[action] || action
  }

  return (
    <main className="shell">
      <section className="panel" style={{ width: 'min(100%, 1000px)' }}>
        <div className="panel-inner">
          <div className="page-head">
            <div>
              <span className="brand">
                <span className="brand-mark" />
                BetterBlog
              </span>
              <h1 className="page-title">Admin Activity Logs</h1>
              <p className="lede">Monitor all administrative actions and critical system events.</p>
            </div>
            <div className="actions">
              <Link className="button-secondary" href="/admin">
                Back to admin
              </Link>
            </div>
          </div>

          {message ? <div className="notice" style={{ marginTop: 16 }}>{message}</div> : null}

          <div className="card" style={{ marginTop: 18 }}>
            <div style={{ marginBottom: 16, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <select
                value={severity}
                onChange={(e) => {
                  setSeverity(e.target.value)
                  setPage(1)
                }}
                style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid rgba(30, 27, 24, 0.12)' }}
              >
                <option value="">All severities</option>
                <option value="info">Information</option>
                <option value="warning">Warnings</option>
                <option value="critical">Critical</option>
              </select>

              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Filter by username"
                style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid rgba(30, 27, 24, 0.12)' }}
              />
            </div>

            {loading ? (
              <p className="muted">Loading activity logs...</p>
            ) : logs.length === 0 ? (
              <p className="muted">No activity to display.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {logs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: 12,
                      backgroundColor: severityColors[log.severity],
                      borderRadius: 8,
                      borderLeft: '4px solid rgba(30, 27, 24, 0.2)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <strong>{getActionLabel(log.action)}</strong>
                          <span className="chip" style={{ fontSize: '0.75em' }}>
                            {log.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="muted" style={{ margin: '4px 0 0 0', fontSize: '0.9em' }}>
                          by @{log.username} • {log.resourceType}
                        </p>
                        {log.resourceName ? (
                          <p className="muted" style={{ margin: '4px 0 0 0', fontSize: '0.85em' }}>
                            {log.resourceName}
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
