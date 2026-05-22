'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { apiUrl } from '@/utils/api'
import { adminFetch, getAdminAccessToken, getAdminErrorMessage } from '../../../utils/admin-auth'

type Moderator = {
  id: string
  username: string
  email: string
  permissions: string[]
  assignedAt: string
  assignedBy: string
}

export default function AdminModeratorsPage() {
  const [moderators, setModerators] = useState<Moderator[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const loadModerators = async () => {
      setLoading(true)

      if (!getAdminAccessToken()) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
        return
      }

      try {
        const response = await adminFetch(apiUrl('/api/admin/moderators'))
        const data = await response.json().catch(() => null)

        if (response.status === 401) {
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
          return
        }

        if (!response.ok) {
          setMessage(getAdminErrorMessage(response, data))
          setModerators([])
          return
        }

        setModerators(Array.isArray(data?.moderators) ? data.moderators : [])
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Failed to load moderators')
      } finally {
        setLoading(false)
      }
    }
    loadModerators()
  }, [pathname, router])

  const handleRemoveModerator = async (moderatorId: string) => {
    if (!confirm('Remove this user from moderator role?')) return

    setActionLoading(moderatorId)
    try {
      const response = await adminFetch(apiUrl(`/api/admin/moderators/${moderatorId}`), {
        method: 'DELETE',
      })

      const data = await response.json().catch(() => null)

      if (response.status === 401) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
        return
      }

      if (!response.ok) {
        setMessage(getAdminErrorMessage(response, data))
        return
      }

      setModerators(moderators.filter((m) => m.id !== moderatorId))
      setMessage('Moderator removed')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error removing moderator')
    } finally {
      setActionLoading(null)
    }
  }

  const moderatorPermissions = [
    'Review reported posts',
    'Make posts private/public',
    'Edit public posts',
    'View moderation queue',
  ]

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
              <h1 className="page-title">Moderation</h1>
              <p className="lede">Manage moderators and their permissions.</p>
            </div>
            <div className="actions">
              <Link className="button-secondary" href="/admin">
                Back to admin
              </Link>
            </div>
          </div>

          {message ? <div className="notice" style={{ marginTop: 16 }}>{message}</div> : null}

          <div className="split" style={{ marginTop: 18 }}>
            <div className="stack-tight">
              <div className="card">
                <h2 style={{ marginTop: 0 }}>Moderator Permissions</h2>
                <p className="muted">Moderators can:</p>
                <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                  {moderatorPermissions.map((perm) => (
                    <li key={perm} className="muted" style={{ marginBottom: 4 }}>
                      {perm}
                    </li>
                  ))}
                </ul>
                <p className="muted" style={{ marginTop: 12, fontSize: '0.9em' }}>
                  <strong>Moderators cannot:</strong> Manage users, change roles, view private user posts (only admin-marked private), or change application settings.
                </p>
              </div>
            </div>

            <div className="stack-tight">
              <div className="card">
                <h2 style={{ marginTop: 0 }}>Active Moderators ({moderators.length})</h2>

                {loading ? (
                  <p className="muted">Loading moderators...</p>
                ) : moderators.length === 0 ? (
                  <p className="muted">No moderators assigned yet. Use the User Management page to promote users.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(30, 27, 24, 0.12)' }}>
                          <th style={{ textAlign: 'left', padding: 8 }}>Username</th>
                          <th style={{ textAlign: 'left', padding: 8 }}>Email</th>
                          <th style={{ textAlign: 'left', padding: 8 }}>Assigned By</th>
                          <th style={{ textAlign: 'left', padding: 8 }}>Date</th>
                          <th style={{ textAlign: 'left', padding: 8 }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {moderators.map((mod) => (
                          <tr key={mod.id} style={{ borderBottom: '1px solid rgba(30, 27, 24, 0.12)' }}>
                            <td style={{ padding: 8 }}>@{mod.username}</td>
                            <td style={{ padding: 8 }}>
                              <span className="muted" style={{ fontSize: '0.9em' }}>{mod.email}</span>
                            </td>
                            <td style={{ padding: 8 }}>
                              <span className="muted" style={{ fontSize: '0.9em' }}>@{mod.assignedBy}</span>
                            </td>
                            <td style={{ padding: 8 }}>
                              <span className="muted" style={{ fontSize: '0.9em' }}>
                                {new Date(mod.assignedAt).toLocaleDateString()}
                              </span>
                            </td>
                            <td style={{ padding: 8 }}>
                              <button
                                className="button-secondary"
                                style={{ fontSize: '0.85em', padding: '4px 8px' }}
                                onClick={() => handleRemoveModerator(mod.id)}
                                disabled={actionLoading === mod.id}
                              >
                                Remove
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
