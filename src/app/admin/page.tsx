'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { apiUrl } from '@/utils/api'
import { adminFetch, getAdminAccessToken, getAdminErrorMessage } from '../../utils/admin-auth'

type Stats = {
  totalUsers: number
  totalPosts: number
  totalPublicPosts: number
  totalPrivatePosts: number
  moderatorsCount: number
  adminsCount: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const loadStats = async () => {
      if (!getAdminAccessToken()) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
        return
      }

      try {
        const response = await adminFetch(apiUrl('/api/admin/stats'))
        const data = await response.json().catch(() => null)

        if (response.status === 401) {
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
          return
        }

        if (!response.ok) {
          setMessage(getAdminErrorMessage(response, data))
          setStats(null)
          return
        }

        setStats(data?.stats || null)
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Failed to load stats')
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [pathname, router])

  return (
    <main className="shell">
      <section className="panel" style={{ width: 'min(100%, 1200px)' }}>
        <div className="panel-inner">
          <div className="page-head">
            <div>
              <span className="brand">
                <span className="brand-mark" />
                BetterBlog
              </span>
              <h1 className="page-title">Admin Dashboard</h1>
              <p className="lede">Manage users, posts, content moderation, and system configuration.</p>
            </div>
            <div className="actions">
              <Link className="button-secondary" href="/">
                Home
              </Link>
              <Link className="button-secondary" href="/admin/posts">
                Posts
              </Link>
              <Link className="button-secondary" href="/admin/users">
                Users
              </Link>
            </div>
          </div>

          {message ? <div className="notice" style={{ marginTop: 16 }}>{message}</div> : null}

          {loading ? (
            <p className="muted">Loading dashboard...</p>
          ) : stats ? (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 16,
                  marginTop: 18,
                }}
              >
                <div className="card">
                  <h3 style={{ margin: '0 0 8px 0' }}>Total Users</h3>
                  <p style={{ fontSize: '1.8em', fontWeight: 'bold', margin: 0 }}>{stats.totalUsers}</p>
                </div>
                <div className="card">
                  <h3 style={{ margin: '0 0 8px 0' }}>Total Posts</h3>
                  <p style={{ fontSize: '1.8em', fontWeight: 'bold', margin: 0 }}>{stats.totalPosts}</p>
                </div>
                <div className="card">
                  <h3 style={{ margin: '0 0 8px 0' }}>Public Posts</h3>
                  <p style={{ fontSize: '1.8em', fontWeight: 'bold', margin: 0, color: 'rgba(34, 197, 94, 1)' }}>
                    {stats.totalPublicPosts}
                  </p>
                </div>
                <div className="card">
                  <h3 style={{ margin: '0 0 8px 0' }}>Private Posts</h3>
                  <p style={{ fontSize: '1.8em', fontWeight: 'bold', margin: 0, color: 'rgba(168, 85, 247, 1)' }}>
                    {stats.totalPrivatePosts}
                  </p>
                </div>
                <div className="card">
                  <h3 style={{ margin: '0 0 8px 0' }}>Moderators</h3>
                  <p style={{ fontSize: '1.8em', fontWeight: 'bold', margin: 0 }}>{stats.moderatorsCount}</p>
                </div>
                <div className="card">
                  <h3 style={{ margin: '0 0 8px 0' }}>Admins</h3>
                  <p style={{ fontSize: '1.8em', fontWeight: 'bold', margin: 0 }}>{stats.adminsCount}</p>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: 16,
                  marginTop: 24,
                }}
              >
                <Link href="/admin/posts" className="card" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                  <h3 style={{ margin: '0 0 8px 0', color: 'inherit' }}>📝 Post Management</h3>
                  <p className="muted" style={{ margin: 0, fontSize: '0.9em' }}>
                    Review, edit, and moderate posts. Make content private or public.
                  </p>
                </Link>

                <Link href="/admin/users" className="card" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                  <h3 style={{ margin: '0 0 8px 0', color: 'inherit' }}>👥 User Management</h3>
                  <p className="muted" style={{ margin: 0, fontSize: '0.9em' }}>
                    View all users and manage roles and permissions.
                  </p>
                </Link>

                <Link href="/admin/moderators" className="card" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                  <h3 style={{ margin: '0 0 8px 0', color: 'inherit' }}>🛡️ Moderation</h3>
                  <p className="muted" style={{ margin: 0, fontSize: '0.9em' }}>
                    Promote users to moderators and manage moderation settings.
                  </p>
                </Link>

                <Link href="/admin/activity" className="card" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                  <h3 style={{ margin: '0 0 8px 0', color: 'inherit' }}>📋 Activity Logs</h3>
                  <p className="muted" style={{ margin: 0, fontSize: '0.9em' }}>
                    Monitor all user activities and security events across the platform.
                  </p>
                </Link>

                <Link href="/admin/config" className="card" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                  <h3 style={{ margin: '0 0 8px 0', color: 'inherit' }}>⚙️ Configuration</h3>
                  <p className="muted" style={{ margin: 0, fontSize: '0.9em' }}>
                    Manage system settings and application configuration.
                  </p>
                </Link>
              </div>

              <div className="card" style={{ marginTop: 24 }}>
                <h2 style={{ marginTop: 0 }}>Admin pages</h2>
                <div className="actions">
                  <Link className="button-secondary" href="/admin/posts">
                    Post management
                  </Link>
                  <Link className="button-secondary" href="/admin/users">
                    User management
                  </Link>
                  <Link className="button-secondary" href="/admin/moderators">
                    Moderators
                  </Link>
                  <Link className="button-secondary" href="/admin/activity">
                    Activity logs
                  </Link>
                  <Link className="button-secondary" href="/admin/config">
                    Configuration
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <p className="muted">Failed to load dashboard data.</p>
          )}
        </div>
      </section>
    </main>
  )
}
