'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { apiUrl } from '@/utils/api'
import { adminFetch, getAdminErrorMessage } from '@/utils/admin-auth'
import type { AdminPost } from '@/types'

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true)

      try {
        const params = new URLSearchParams()
        params.set('page', page.toString())
        if (filter !== 'all') params.set('visibility', filter)
        const response = await adminFetch(
          apiUrl(
            `/api/admin/posts${params.toString() ? `?${params.toString()}` : ''}`,
          ),
        )
        const data = await response.json().catch(() => null)

        if (response.status === 401) {
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
          return
        }

        if (!response.ok) {
          setMessage(getAdminErrorMessage(response, data))
          setPosts([])
          setTotalPages(1)
          return
        }

        setPosts(Array.isArray(data?.posts) ? data.posts : [])
        setTotalPages(data?.totalPages || 1)
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : 'Failed to load posts',
        )
      } finally {
        setLoading(false)
      }
    }
    loadPosts()
  }, [filter, page, pathname, router])

  const handleChangeVisibility = async (
    postId: string,
    newVisibility: string,
  ) => {
    setActionLoading(postId)
    try {
      const response = await adminFetch(apiUrl(`/api/admin/posts/${postId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: newVisibility }),
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

      setPosts(
        posts.map((post) =>
          post.id === postId ? { ...post, visibility: newVisibility } : post,
        ),
      )
      setMessage('Post visibility updated')
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Error updating post',
      )
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Permanently delete this post?')) return

    setActionLoading(postId)
    try {
      const response = await adminFetch(apiUrl(`/api/admin/posts/${postId}`), {
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

      setPosts(posts.filter((p) => p.id !== postId))
      setMessage('Post deleted')
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Error deleting post',
      )
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <main className='shell'>
      <section className='panel' style={{ width: 'min(100%, 1000px)' }}>
        <div className='panel-inner'>
          <div className='page-head'>
            <div>
              <span className='brand'>
                <span className='brand-mark' />
                BetterBlog
              </span>
              <h1 className='page-title'>Post Management</h1>
              <p className='lede'>
                Review and moderate posts. Admins can make posts private or
                public.
              </p>
            </div>
            <div className='actions'>
              <Link className='button-secondary' href='/admin'>
                Back to admin
              </Link>
            </div>
          </div>

          {message ? (
            <div className='notice' style={{ marginTop: 16 }}>
              {message}
            </div>
          ) : null}

          <div className='card' style={{ marginTop: 18 }}>
            <div style={{ marginBottom: 16 }}>
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value)
                  setPage(1)
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid rgba(30, 27, 24, 0.12)',
                }}
              >
                <option value='all'>All posts</option>
                <option value='public'>Public</option>
                <option value='private'>Private</option>
                <option value='admin-private'>Admin private</option>
              </select>
            </div>

            {loading ? (
              <p className='muted'>Loading posts...</p>
            ) : posts.length === 0 ? (
              <p className='muted'>No posts to display.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr
                      style={{
                        borderBottom: '1px solid rgba(30, 27, 24, 0.12)',
                      }}
                    >
                      <th style={{ textAlign: 'left', padding: 12 }}>Title</th>
                      <th style={{ textAlign: 'left', padding: 12 }}>Author</th>
                      <th style={{ textAlign: 'left', padding: 12 }}>
                        Visibility
                      </th>
                      <th style={{ textAlign: 'left', padding: 12 }}>
                        Created
                      </th>
                      <th style={{ textAlign: 'left', padding: 12 }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((post) => (
                      <tr
                        key={post.id}
                        style={{
                          borderBottom: '1px solid rgba(30, 27, 24, 0.12)',
                        }}
                      >
                        <td style={{ padding: 12 }}>
                          <strong>{post.title}</strong>
                          <p
                            className='muted'
                            style={{ margin: '4px 0 0 0', fontSize: '0.85em' }}
                          >
                            {post.excerpt}
                          </p>
                        </td>
                        <td style={{ padding: 12 }}>
                          @{post.authorUsername}
                        </td>
                        <td style={{ padding: 12 }}>
                          <span className='chip'>{post.visibility}</span>
                          {post.madePrivateBy ? (
                            <p
                              className='muted'
                              style={{ margin: '4px 0 0 0', fontSize: '0.8em' }}
                            >
                              by {post.madePrivateBy}
                            </p>
                          ) : null}
                        </td>
                        <td style={{ padding: 12 }}>
                          <span className='muted' style={{ fontSize: '0.9em' }}>
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td style={{ padding: 12 }}>
                          <div
                            style={{
                              display: 'flex',
                              gap: 4,
                              flexWrap: 'wrap',
                            }}
                          >
                            <select
                              value={post.visibility}
                              onChange={(e) =>
                                handleChangeVisibility(post.id, e.target.value)
                              }
                              disabled={actionLoading === post.id}
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.85em',
                                borderRadius: 4,
                                border: '1px solid rgba(30, 27, 24, 0.12)',
                              }}
                            >
                              <option value='public'>Public</option>
                              <option value='private'>Private</option>
                              <option value='admin-private'>
                                Admin private
                              </option>
                            </select>
                            <button
                              className='button-secondary'
                              style={{ fontSize: '0.85em', padding: '4px 8px' }}
                              onClick={() => handleDeletePost(post.id)}
                              disabled={actionLoading === post.id}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div
                style={{
                  marginTop: 16,
                  display: 'flex',
                  gap: 8,
                  justifyContent: 'center',
                }}
              >
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className='button-secondary'
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
                  className='button-secondary'
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
