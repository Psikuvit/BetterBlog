'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { apiUrl } from '@/utils/api'
import { adminFetch, getAdminAccessToken, getAdminErrorMessage } from '@/utils/admin-auth'

type AdminUser = {
  id: string
  username: string
  email: string
  role: 'USER' | 'MODERATOR' | 'ADMIN'
  createdAt: string
  postsCount: number
  lastLoginAt?: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true)

      if (!getAdminAccessToken()) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
        return
      }

      try {
        const params = new URLSearchParams()
        params.set('page', page.toString())
        if (filter !== 'all') params.set('role', filter.toUpperCase())
        const response = await adminFetch(apiUrl(`/api/admin/users${params.toString() ? `?${params.toString()}` : ''}`))
        const data = await response.json().catch(() => null)

        if (response.status === 401) {
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
          return
        }

        if (!response.ok) {
          setMessage(getAdminErrorMessage(response, data))
          setUsers([])
          setTotalPages(1)
          return
        }

        setUsers(Array.isArray(data?.users) ? data.users : [])
        setTotalPages(data?.totalPages || 1)
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Failed to load users')
      } finally {
        setLoading(false)
      }
    }
    loadUsers()
  }, [filter, page, pathname, router])

  const handlePromoteRole = async (userId: string, newRole: 'USER' | 'MODERATOR' | 'ADMIN') => {
    setActionLoading(userId)
    try {
      const response = await adminFetch(apiUrl(`/api/admin/users/${userId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
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

      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      )
      setMessage(`User promoted to ${newRole}`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error updating user')
    } finally {
      setActionLoading(null)
    }
  }

  const roleColors: Record<string, string> = {
    USER: 'rgba(107, 114, 128, 0.2)',
    MODERATOR: 'rgba(251, 146, 60, 0.2)',
    ADMIN: 'rgba(239, 68, 68, 0.2)',
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
              <h1 className="page-title">User Management</h1>
              <p className="lede">View all users and manage their roles and permissions.</p>
            </div>
            <div className="actions">
              <Link className="button-secondary" href="/admin">
                Back to admin
              </Link>
            </div>
          </div>

          {message ? <div className="notice" style={{ marginTop: 16 }}>{message}</div> : null}

          <div className="card" style={{ marginTop: 18 }}>
            <div style={{ marginBottom: 16 }}>
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value)
                  setPage(1)
                }}
                style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid rgba(30, 27, 24, 0.12)' }}
              >
                <option value="all">All users</option>
                <option value="user">Regular users</option>
                <option value="moderator">Moderators</option>
                <option value="admin">Admins</option>
              </select>
            </div>

            {loading ? (
              <p className="muted">Loading users...</p>
            ) : users.length === 0 ? (
              <p className="muted">No users to display.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(30, 27, 24, 0.12)' }}>
                      <th style={{ textAlign: 'left', padding: 12 }}>Username</th>
                      <th style={{ textAlign: 'left', padding: 12 }}>Email</th>
                      <th style={{ textAlign: 'left', padding: 12 }}>Role</th>
                      <th style={{ textAlign: 'left', padding: 12 }}>Posts</th>
                      <th style={{ textAlign: 'left', padding: 12 }}>Joined</th>
                      <th style={{ textAlign: 'left', padding: 12 }}>Last Login</th>
                      <th style={{ textAlign: 'left', padding: 12 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} style={{ borderBottom: '1px solid rgba(30, 27, 24, 0.12)' }}>
                        <td style={{ padding: 12 }}>
                          <strong>@{user.username}</strong>
                        </td>
                        <td style={{ padding: 12 }}>
                          <span className="muted" style={{ fontSize: '0.9em' }}>{user.email}</span>
                        </td>
                        <td style={{ padding: 12 }}>
                          <span
                            className="chip"
                            style={{
                              backgroundColor: roleColors[user.role],
                            }}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td style={{ padding: 12 }}>{user.postsCount}</td>
                        <td style={{ padding: 12 }}>
                          <span className="muted" style={{ fontSize: '0.9em' }}>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td style={{ padding: 12 }}>
                          <span className="muted" style={{ fontSize: '0.9em' }}>
                            {user.lastLoginAt
                              ? new Date(user.lastLoginAt).toLocaleDateString()
                              : 'Never'}
                          </span>
                        </td>
                        <td style={{ padding: 12 }}>
                          <select
                            value={user.role}
                            onChange={(e) => handlePromoteRole(user.id, e.target.value.toUpperCase() as 'USER' | 'MODERATOR' | 'ADMIN')}
                            disabled={actionLoading === user.id}
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.85em',
                              borderRadius: 4,
                              border: '1px solid rgba(30, 27, 24, 0.12)',
                            }}
                          >
                            <option value="USER">User</option>
                            <option value="MODERATOR">Moderator</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
