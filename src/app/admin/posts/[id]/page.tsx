'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AdminNav } from '@/components/admin-nav'
import { useStaffAccess } from '@/hooks/use-staff-access'
import { apiUrl } from '@/utils/api'
import { adminFetch, getAdminErrorMessage } from '@/utils/admin-auth'
import type { PostDetail } from '@/types'

function getPostDetail(payload: unknown): PostDetail | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const candidate =
    'post' in payload
      ? (payload as { post?: unknown }).post
      : 'data' in payload
        ? (payload as { data?: unknown }).data
        : payload

  if (!candidate || typeof candidate !== 'object' || !('id' in candidate)) {
    return null
  }

  return candidate as PostDetail
}

const tagList = (value: string) =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)

export default function AdminPostEditPage() {
  const { ready, role, isAdmin } = useStaffAccess()
  const params = useParams<{ id: string }>()
  const id = params.id
  const router = useRouter()
  const [post, setPost] = useState<PostDetail | null>(null)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [visibility, setVisibility] = useState('PUBLIC')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ready) return

    const loadPost = async () => {
      setLoading(true)
      const response = await adminFetch(apiUrl(`/api/posts/${id}`))
      const data = await response.json().catch(() => null)
      const nextPost = getPostDetail(data)

      if (response.status === 401) {
        router.replace(`/login?redirect=${encodeURIComponent(`/admin/posts/${id}`)}`)
        return
      }

      if (!response.ok || !nextPost) {
        setPost(null)
        setMessage(getAdminErrorMessage(response, data))
        setLoading(false)
        return
      }

      setPost(nextPost)
      setTitle(nextPost.title)
      setSlug(nextPost.slug)
      setExcerpt(nextPost.excerpt)
      setContent(nextPost.content)
      setTags((nextPost.tags || []).join(', '))
      setVisibility(nextPost.visibility || 'PUBLIC')
      setCoverImageUrl(nextPost.coverImageUrl || '')
      setSourceUrl(nextPost.sourceUrl || '')
      setLoading(false)
    }

    void loadPost()
  }, [id, ready, router])

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const response = await adminFetch(apiUrl(`/api/posts/${id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        slug,
        content,
        visibility,
        ...(excerpt ? { excerpt } : {}),
        tags: tagList(tags),
        ...(coverImageUrl ? { coverImageUrl } : {}),
        ...(sourceUrl ? { sourceUrl } : {}),
      }),
    })

    const data = await response.json().catch(() => null)
    const nextPost = getPostDetail(data)

    if (!response.ok) {
      setMessage(getAdminErrorMessage(response, data))
      return
    }

    if (nextPost) {
      setPost(nextPost)
    }
    setMessage('Post saved')
  }

  const handleVisibilityChange = async (newVisibility: string) => {
    setVisibility(newVisibility)

    const response = await adminFetch(apiUrl(`/api/admin/posts/${id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visibility: newVisibility }),
    })

    const data = await response.json().catch(() => null)
    if (!response.ok) {
      setMessage(getAdminErrorMessage(response, data))
      return
    }

    const nextPost = getPostDetail(data)
    if (nextPost) {
      setPost(nextPost)
      setVisibility(nextPost.visibility)
    }
    setMessage('Visibility updated')
  }

  const handleDelete = async () => {
    if (!isAdmin || !confirm('Permanently delete this post?')) return

    const response = await adminFetch(apiUrl(`/api/admin/posts/${id}`), {
      method: 'DELETE',
    })

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      setMessage(getAdminErrorMessage(response, data))
      return
    }

    router.push('/admin/posts')
  }

  if (!ready || !role) {
    return null
  }

  return (
    <main className='shell'>
      <section className='panel' style={{ width: 'min(100%, 960px)' }}>
        <div className='panel-inner'>
          <div className='page-head'>
            <div>
              <span className='brand'>
                <span className='brand-mark' />
                BetterBlog
              </span>
              <h1 className='page-title'>{post ? post.title : 'Edit post'}</h1>
              <p className='lede'>Staff post editor for moderation.</p>
            </div>
            <AdminNav role={role} />
          </div>

          {message ? (
            <div className='notice' style={{ marginTop: 16 }}>
              {message}
            </div>
          ) : null}

          {loading ? (
            <p className='muted'>Loading post...</p>
          ) : post ? (
            <form className='split' onSubmit={handleSave} style={{ marginTop: 18 }}>
              <div className='stack-tight'>
                <div className='card'>
                  <div className='form'>
                    <div className='field'>
                      <label htmlFor='title'>Title</label>
                      <input
                        id='title'
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                      />
                    </div>
                    <div className='grid-2'>
                      <div className='field'>
                        <label htmlFor='slug'>Slug</label>
                        <input
                          id='slug'
                          value={slug}
                          onChange={(event) => setSlug(event.target.value)}
                        />
                      </div>
                      <div className='field'>
                        <label htmlFor='visibility'>Visibility</label>
                        <select
                          id='visibility'
                          value={visibility}
                          onChange={(event) =>
                            void handleVisibilityChange(event.target.value)
                          }
                        >
                          <option value='PUBLIC'>Public</option>
                          <option value='ADMIN_PRIVATE'>Staff private</option>
                        </select>
                      </div>
                    </div>
                    <div className='field'>
                      <label htmlFor='excerpt'>Excerpt</label>
                      <textarea
                        id='excerpt'
                        value={excerpt}
                        onChange={(event) => setExcerpt(event.target.value)}
                      />
                    </div>
                    <div className='field'>
                      <label htmlFor='content'>HTML content</label>
                      <textarea
                        id='content'
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                      />
                    </div>
                    <div className='field'>
                      <label htmlFor='tags'>Tags</label>
                      <input
                        id='tags'
                        value={tags}
                        onChange={(event) => setTags(event.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className='card'>
                  <h2 style={{ marginTop: 0 }}>Source info</h2>
                  <div className='field'>
                    <label htmlFor='sourceUrl'>External URL</label>
                    <input
                      id='sourceUrl'
                      value={sourceUrl}
                      onChange={(event) => setSourceUrl(event.target.value)}
                    />
                  </div>
                  <div className='field'>
                    <label htmlFor='coverImageUrl'>Cover image URL</label>
                    <input
                      id='coverImageUrl'
                      value={coverImageUrl}
                      onChange={(event) => setCoverImageUrl(event.target.value)}
                    />
                  </div>
                  {isAdmin ? (
                    <div className='actions'>
                      <button
                        className='button-secondary'
                        type='button'
                        onClick={() => void handleDelete()}
                      >
                        Delete post
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className='stack-tight'>
                <div className='card'>
                  <h2 style={{ marginTop: 0 }}>Preview</h2>
                  {post.sourcePreviewTitle ? (
                    <div className='stack-tight'>
                      <strong>{post.sourcePreviewTitle}</strong>
                      <p className='muted' style={{ margin: 0 }}>
                        {post.sourcePreviewDescription || 'No description found.'}
                      </p>
                      {post.sourcePreviewImage ? (
                        <Image
                          src={post.sourcePreviewImage}
                          alt={post.sourcePreviewTitle || 'Preview'}
                          width={500}
                          height={300}
                          style={{
                            width: '100%',
                            height: 'auto',
                            borderRadius: 18,
                          }}
                        />
                      ) : null}
                    </div>
                  ) : (
                    <p className='muted'>No stored preview yet.</p>
                  )}
                </div>

                <div className='actions'>
                  <button className='button' type='submit'>
                    Save changes
                  </button>
                  <Link className='button-secondary' href='/admin/posts'>
                    Back to posts
                  </Link>
                </div>
              </div>
            </form>
          ) : null}
        </div>
      </section>
    </main>
  )
}
