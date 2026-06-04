'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AdminNav } from '@/components/admin-nav'
import { useStaffAccess } from '@/hooks/use-staff-access'
import { apiUrl } from '@/utils/api'
import { adminFetch, getAdminErrorMessage } from '@/utils/admin-auth'
import type { Stats } from '@/types'

function getPublicPostCount(payload: unknown): number | null {
  if (typeof payload === 'number' && Number.isFinite(payload)) {
    return payload
  }

  if (!payload || typeof payload !== 'object') {
    return null
  }

  const count =
    'count' in payload
      ? (payload as { count?: unknown }).count
      : 'total' in payload
        ? (payload as { total?: unknown }).total
        : 'publicCount' in payload
          ? (payload as { publicCount?: unknown }).publicCount
          : null

  return typeof count === 'number' && Number.isFinite(count) ? count : null
}

export default function AdminDashboard() {
  const { ready, role, isAdmin } = useStaffAccess()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!ready) return

    const loadStats = async () => {
      if (!isAdmin) {
        setLoading(false)
        return
      }

      try {
        const [statsResponse, publicCountResponse] = await Promise.all([
          adminFetch(apiUrl('/api/admin/stats')),
          fetch(apiUrl('/api/posts/public/count')),
        ])

        const [statsData, publicCountData] = await Promise.all([
          statsResponse.json().catch(() => null),
          publicCountResponse.json().catch(() => null),
        ])

        if (statsResponse.status === 401) {
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
          return
        }

        if (!statsResponse.ok) {
          setMessage(getAdminErrorMessage(statsResponse, statsData))
          setStats(null)
          return
        }

        const nextStats = statsData?.stats || statsData || null

        if (nextStats) {
          const publicPostsCount = getPublicPostCount(publicCountData)
          setStats({
            ...nextStats,
            totalPublicPosts: publicPostsCount ?? nextStats.totalPublicPosts,
          })
          return
        }

        setStats(null)
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : 'Failed to load stats',
        )
      } finally {
        setLoading(false)
      }
    }
    void loadStats()
  }, [isAdmin, pathname, ready, router])

  if (!ready || !role) {
    return null
  }

  return (
    <main className='shell'>
      <section className='panel' style={{ width: 'min(100%, 1200px)' }}>
        <div className='panel-inner'>
          <div className='page-head'>
            <div>
              <span className='brand'>
                <span className='brand-mark' />
                BetterBlog
              </span>
              <h1 className='page-title'>
                {isAdmin ? 'Admin Dashboard' : 'Moderation Dashboard'}
              </h1>
              <p className='lede'>
                {isAdmin
                  ? 'Manage users, posts, moderation, and system configuration.'
                  : 'Review and moderate public posts. User-private posts are hidden for compliance.'}
              </p>
            </div>
            <AdminNav role={role} />
          </div>

          {message ? (
            <div className='notice' style={{ marginTop: 16 }}>
              {message}
            </div>
          ) : null}

          {loading ? (
            <p className='muted'>Loading dashboard...</p>
          ) : isAdmin && stats ? (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 16,
                  marginTop: 18,
                }}
              >
                <div className='card'>
                  <h3 style={{ margin: '0 0 8px 0' }}>Total Users</h3>
                  <p
                    style={{ fontSize: '1.8em', fontWeight: 'bold', margin: 0 }}
                  >
                    {stats.totalUsers}
                  </p>
                </div>
                <div className='card'>
                  <h3 style={{ margin: '0 0 8px 0' }}>Total Posts</h3>
                  <p
                    style={{ fontSize: '1.8em', fontWeight: 'bold', margin: 0 }}
                  >
                    {stats.totalPosts}
                  </p>
                </div>
                <div className='card'>
                  <h3 style={{ margin: '0 0 8px 0' }}>Public Posts</h3>
                  <p
                    style={{
                      fontSize: '1.8em',
                      fontWeight: 'bold',
                      margin: 0,
                      color: 'rgba(34, 197, 94, 1)',
                    }}
                  >
                    {stats.totalPublicPosts}
                  </p>
                </div>
                <div className='card'>
                  <h3 style={{ margin: '0 0 8px 0' }}>Staff-private Posts</h3>
                  <p
                    style={{
                      fontSize: '1.8em',
                      fontWeight: 'bold',
                      margin: 0,
                      color: 'rgba(168, 85, 247, 1)',
                    }}
                  >
                    {stats.totalPrivatePosts}
                  </p>
                </div>
                <div className='card'>
                  <h3 style={{ margin: '0 0 8px 0' }}>Moderators</h3>
                  <p
                    style={{ fontSize: '1.8em', fontWeight: 'bold', margin: 0 }}
                  >
                    {stats.moderatorsCount}
                  </p>
                </div>
                <div className='card'>
                  <h3 style={{ margin: '0 0 8px 0' }}>Admins</h3>
                  <p
                    style={{ fontSize: '1.8em', fontWeight: 'bold', margin: 0 }}
                  >
                    {stats.adminsCount}
                  </p>
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
                <DashboardLink
                  href='/admin/posts'
                  title='Post Management'
                  description='Review, edit, and moderate posts.'
                />
                <DashboardLink
                  href='/admin/users'
                  title='User Management'
                  description='View users and promote roles.'
                />
                <DashboardLink
                  href='/admin/moderators'
                  title='Moderators'
                  description='Manage moderator assignments.'
                />
                <DashboardLink
                  href='/admin/activity'
                  title='Activity Logs'
                  description='Monitor platform activity.'
                />
                <DashboardLink
                  href='/admin/config'
                  title='Configuration'
                  description='Manage application settings.'
                />
              </div>
            </>
          ) : (
            <div className='card' style={{ marginTop: 18 }}>
              <h2 style={{ marginTop: 0 }}>Moderation tools</h2>
              <p className='muted'>
                You can review public posts, edit them, hide them from the
                public feed, and republish posts you previously made private.
              </p>
              <div className='actions' style={{ marginTop: 12 }}>
                <Link className='button' href='/admin/posts'>
                  Open post management
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

function DashboardLink({
  href,
  title,
  description,
}: {
  href: string
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className='card'
      style={{ textDecoration: 'none', cursor: 'pointer' }}
    >
      <h3 style={{ margin: '0 0 8px 0', color: 'inherit' }}>{title}</h3>
      <p className='muted' style={{ margin: 0, fontSize: '0.9em' }}>
        {description}
      </p>
    </Link>
  )
}
