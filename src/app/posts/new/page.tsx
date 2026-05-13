'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/auth-context'

type PreviewData = {
  url: string
  title: string
  description: string
  image: string
}

const tagList = (value: string) =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)

export default function NewPostPage() {
  const router = useRouter()
  const { user, authFetch } = useAuth()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('<p>Write your post here.</p>')
  const [tags, setTags] = useState('')
  const [visibility, setVisibility] = useState('public')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [originalAuthor, setOriginalAuthor] = useState('')
  const [legacyId, setLegacyId] = useState('')
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const loadPreview = async (urlValue: string) => {
    if (!urlValue) {
      setPreview(null)
      return
    }

    try {
      const response = await fetch('/api/posts/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlValue }),
      })
      const data = await response.json()
      setPreview(response.ok ? data.preview : null)
    } catch {
      setPreview(null)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPreview(sourceUrl)
    }, 500)

    return () => window.clearTimeout(timer)
  }, [sourceUrl])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    const response = await authFetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        slug,
        excerpt,
        content,
        tags: tagList(tags),
        visibility,
        coverImageUrl,
        sourceUrl,
        originalAuthor,
        legacyId,
      }),
    })

    const data = await response.json().catch(() => null)
    setLoading(false)

    if (!response.ok) {
      setMessage(data?.error || 'Create failed')
      return
    }

    setMessage('Post created')
    router.push(`/posts/${data.post.id}`)
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
              <h1 className="page-title">New post</h1>
              <p className="lede">Create a post, attach a cover image, and preview an external URL before saving.</p>
            </div>
            <div className="actions">
              <Link className="button-secondary" href="/posts">
                Back to posts
              </Link>
            </div>
          </div>

          {!user ? <div className="notice">Sign in to create posts.</div> : null}

          <form className="split" onSubmit={handleSubmit} style={{ marginTop: 18 }}>
            <div className="stack-tight">
              <div className="card">
                <div className="form">
                  <div className="field">
                    <label htmlFor="title">Title</label>
                    <input id="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="My first post" />
                  </div>
                  <div className="grid-2">
                    <div className="field">
                      <label htmlFor="slug">Slug</label>
                      <input id="slug" value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="my-first-post" />
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
                    <textarea id="excerpt" value={excerpt} onChange={(event) => setExcerpt(event.target.value)} placeholder="A short summary." />
                  </div>
                  <div className="field">
                    <label htmlFor="content">HTML content</label>
                    <textarea id="content" value={content} onChange={(event) => setContent(event.target.value)} />
                  </div>
                  <div className="field">
                    <label htmlFor="tags">Tags</label>
                    <input id="tags" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="nextjs, mongodb, ui" />
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 style={{ marginTop: 0 }}>Source details</h2>
                <div className="field">
                  <label htmlFor="sourceUrl">External URL</label>
                  <input id="sourceUrl" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://example.com/article" />
                </div>
                <div className="grid-2">
                  <div className="field">
                    <label htmlFor="coverImageUrl">Cover image URL</label>
                    <input id="coverImageUrl" value={coverImageUrl} onChange={(event) => setCoverImageUrl(event.target.value)} placeholder="https://.../cover.jpg" />
                  </div>
                  <div className="field">
                    <label htmlFor="originalAuthor">Original author</label>
                    <input id="originalAuthor" value={originalAuthor} onChange={(event) => setOriginalAuthor(event.target.value)} placeholder="Jane Doe" />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="legacyId">Legacy ID</label>
                  <input id="legacyId" value={legacyId} onChange={(event) => setLegacyId(event.target.value)} placeholder="old-platform-123" />
                </div>
                <div className="actions">
                  <button className="button-secondary" type="button" onClick={() => void loadPreview(sourceUrl)}>
                    Refresh preview
                  </button>
                </div>
              </div>
            </div>

            <div className="stack-tight">
              <div className="card">
                <h2 style={{ marginTop: 0 }}>Preview</h2>
                {preview ? (
                  <div className="stack-tight">
                    <strong>{preview.title}</strong>
                    <p className="muted" style={{ margin: 0 }}>
                      {preview.description || 'No description found.'}
                    </p>
                    {preview.image ? (
                      <img src={preview.image} alt={preview.title} style={{ width: '100%', borderRadius: 18, border: '1px solid rgba(30, 27, 24, 0.12)' }} />
                    ) : null}
                    <a className="button-secondary" href={preview.url} target="_blank" rel="noreferrer">
                      Open source URL
                    </a>
                  </div>
                ) : (
                  <p className="muted">Add an external URL to generate a preview.</p>
                )}
              </div>

              {message ? <div className="notice">{message}</div> : null}

              <div className="actions">
                <button className="button" type="submit" disabled={loading || !user}>
                  {loading ? 'Saving...' : 'Create post'}
                </button>
                <Link className="button-secondary" href="/posts">
                  Cancel
                </Link>
              </div>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}