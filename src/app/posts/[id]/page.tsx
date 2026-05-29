'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { apiUrl } from '@/utils/api'
import { authFetch, getAuthErrorMessage } from '@/utils/auth'
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

export default function PostDetailPage() {
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
    const loadPost = async () => {
      setLoading(true)
      const response = await authFetch(apiUrl(`/api/posts/${id}`))
      const data = await response.json().catch(() => null)
      const nextPost = getPostDetail(data)

      if (!response.ok) {
        setPost(null)
        setMessage(getAuthErrorMessage(data, 'Post not found'))
        setLoading(false)
        return
      }

      if (!nextPost) {
        setPost(null)
        setMessage('Post data was incomplete. Please refresh and try again.')
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

    loadPost()
  }, [id])

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const buildPostBody = () => ({
      title,
      slug,
      content,
      visibility: visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC',
      ...(excerpt ? { excerpt } : {}),
      tags: tagList(tags),
      ...(coverImageUrl ? { coverImageUrl } : {}),
      ...(sourceUrl ? { sourceUrl } : {}),
    })

    const response = await authFetch(apiUrl(`/api/posts/${id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPostBody()),
    })

    const data = await response.json().catch(() => null)
    const nextPost = getPostDetail(data)
    if (!response.ok) {
      setMessage(getAuthErrorMessage(data, 'Save failed'))
      return
    }

    if (!nextPost) {
      setMessage('Post saved, but the response did not include post details.')
      return
    }

    setPost(nextPost)
    setMessage('Post saved')
  }

  const handleDelete = async () => {
    const response = await authFetch(apiUrl(`/api/posts/${id}`), { method: 'DELETE' })
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      setMessage(getAuthErrorMessage(data, 'Delete failed'))
      return
    }

    router.push('/posts')
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
              <h1 className="page-title">{post ? post.title : 'Post'}</h1>
              <p className="lede">Open a post directly, edit it in place, or delete it when you are done testing.</p>
            </div>
            <div className="actions">
              <Link className="button-secondary" href="/posts">
                Back to posts
              </Link>
              <Link className="button-secondary" href="/posts/new">
                New post
              </Link>
            </div>
          </div>

          {message ? <div className="notice" style={{ marginTop: 16 }}>{message}</div> : null}

          {loading ? (
            <p className="muted">Loading post...</p>
          ) : post ? (
            <form className="split" onSubmit={handleSave} style={{ marginTop: 18 }}>
              <div className="stack-tight">
                <div className="card">
                  <div className="form">
                    <div className="field">
                      <label htmlFor="title">Title</label>
                      <input id="title" value={title} onChange={(event) => setTitle(event.target.value)} />
                    </div>
                    <div className="grid-2">
                      <div className="field">
                        <label htmlFor="slug">Slug</label>
                        <input id="slug" value={slug} onChange={(event) => setSlug(event.target.value)} />
                      </div>
                      <div className="field">
                        <label htmlFor="visibility">Visibility</label>
                        <select id="visibility" value={visibility} onChange={(event) => setVisibility(event.target.value)}>
                          <option value="public">Public</option>
                          <option value="private">Private</option>
                          <option value="admin-private">Admin private</option>
                        </select>
                      </div>
                    </div>
                    <div className="field">
                      <label htmlFor="excerpt">Excerpt</label>
                      <textarea id="excerpt" value={excerpt} onChange={(event) => setExcerpt(event.target.value)} />
                    </div>
                    <div className="field">
                      <label htmlFor="content">HTML content</label>
                      <textarea id="content" value={content} onChange={(event) => setContent(event.target.value)} />
                    </div>
                    <div className="field">
                      <label htmlFor="tags">Tags</label>
                      <input id="tags" value={tags} onChange={(event) => setTags(event.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h2 style={{ marginTop: 0 }}>Source info</h2>
                  <div className="field">
                    <label htmlFor="sourceUrl">External URL</label>
                    <input id="sourceUrl" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} />
                  </div>
                  <div className="field">
                    <label htmlFor="coverImageUrl">Cover image URL</label>
                    <input id="coverImageUrl" value={coverImageUrl} onChange={(event) => setCoverImageUrl(event.target.value)} />
                  </div>
                  <div className="actions">
                    <button className="button-secondary" type="button" onClick={handleDelete}>
                      Delete post
                    </button>
                  </div>
                </div>
              </div>

              <div className="stack-tight">
                <div className="card">
                  <h2 style={{ marginTop: 0 }}>Direct link</h2>
                  <p className="muted" style={{ marginTop: 0 }}>
                    /posts/{id}
                  </p>
                  <div className="post-meta">
                    <span className="chip">{post.visibility}</span>
                    {post.tags.map((item) => (
                      <span key={item} className="chip chip-muted">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <h2 style={{ marginTop: 0 }}>Preview</h2>
                  {post.sourcePreviewTitle ? (
                    <div className="stack-tight">
                      <strong>{post.sourcePreviewTitle}</strong>
                      <p className="muted" style={{ margin: 0 }}>
                        {post.sourcePreviewDescription || 'No description found.'}
                      </p>
                      {post.sourcePreviewImage ? <Image src={post.sourcePreviewImage} alt={post.sourcePreviewTitle || 'Preview'} width={500} height={300} style={{ width: '100%', height: 'auto', borderRadius: 18 }} /> : null}
                    </div>
                  ) : (
                    <p className="muted">No stored preview yet.</p>
                  )}
                </div>

                <div className="card">
                  <h2 style={{ marginTop: 0 }}>History</h2>
                  <p className="muted">Created: {post.createdAt || 'unknown'}</p>
                  <p className="muted">Updated: {post.updatedAt || 'unknown'}</p>
                  <p className="muted">Published: {post.publishedAt || 'unpublished'}</p>
                </div>

                <div className="actions">
                  <button className="button" type="submit">
                    Save changes
                  </button>
                  <Link className="button-secondary" href="/posts/new">
                    Create another
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