'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiUrl } from '@/utils/api'
import { authFetch, getAuthErrorMessage } from '@/utils/auth'

type PostItem = {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  tags: string[]
  visibility: string
  coverImageUrl: string
  isPublic: boolean
  publishedAt: string | null
  sourceUrl: string | null
  sourcePreviewTitle: string | null
  sourcePreviewDescription: string | null
  sourcePreviewImage: string | null
  createdAt: string | null
  updatedAt: string | null
  authorUsername?: string | null
}

type PostsResponse = {
  content?: unknown[]
  totalElements?: number
  totalPages?: number
}

function isPostItem(value: unknown): value is PostItem {
  return typeof value === 'object' && value !== null && 'id' in value
}

export default function PostsPage() {
  const [posts, setPosts] = useState<PostItem[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState('')
  const [format, setFormat] = useState<'json' | 'csv'>('json')
  const [importPayload, setImportPayload] = useState('')
  const [importFormat, setImportFormat] = useState<'json' | 'csv'>('json')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const loadPosts = useCallback(
    async (showLoading = true) => {
      if (showLoading) {
        setLoading(true)
      }

      try {
        const params = new URLSearchParams()
        params.set('page', '0')
        params.set('size', '10')
        if (query) params.set('q', query)
        if (tag) params.set('tag', tag)
        const response = await authFetch(apiUrl(`/api/posts${params.toString() ? `?${params.toString()}` : ''}`))
        const data = (await response.json().catch(() => null)) as PostsResponse | null
        setPosts(Array.isArray(data?.content) ? data.content.filter(isPostItem) : [])
        setTotalElements(typeof data?.totalElements === 'number' ? data.totalElements : 0)
        setTotalPages(typeof data?.totalPages === 'number' ? data.totalPages : 0)
        setSelectedIds([])
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Failed to load posts')
      } finally {
        setLoading(false)
      }
    },
    [query, tag]
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPosts(false)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadPosts])

  const filteredCount = useMemo(() => posts.length, [posts])

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]))
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return
    const response = await authFetch(apiUrl('/api/posts'), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds }),
    })

    const data = await response.json().catch(() => null)
    if (!response.ok) {
      setMessage(getAuthErrorMessage(data, 'Delete failed'))
      return
    }

    setMessage(`Deleted ${data?.deletedCount ?? 0} post(s)`)
    void loadPosts()
  }

  const handleExport = async (nextFormat: 'json' | 'csv') => {
    const params = new URLSearchParams()
    params.set('format', nextFormat)
    if (tag) params.set('tags', tag)
    if (query) params.set('q', query)

    const response = await authFetch(apiUrl(`/api/posts/export?${params.toString()}`), {
      method: 'POST',
    })

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      setMessage(getAuthErrorMessage(data, 'Export failed'))
      return
    }

    const blob = await response.blob()
    const downloadUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = downloadUrl
    anchor.download = `betterblog-posts.${nextFormat === 'csv' ? 'csv' : 'json'}`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(downloadUrl)
  }

  const handleImport = async () => {
    const response = await authFetch(apiUrl('/api/posts/import'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format: importFormat, payload: importPayload }),
    })

    const data = await response.json().catch(() => null)
    if (!response.ok) {
      setMessage(getAuthErrorMessage(data, 'Import failed'))
      return
    }

    setMessage(`Imported ${data?.importedCount ?? 0} post(s)`)
    setImportPayload('')
    void loadPosts()
  }

  return (
    <main className="shell">
      <section className="panel">
        <div className="panel-inner">
          <div className="page-head">
            <div>
              <span className="brand">
                <span className="brand-mark" />
                BetterBlog
              </span>
              <h1 className="page-title">Posts</h1>
              <p className="lede">Search public posts, inspect private ones when signed in, and manage imports or exports from one place.</p>
            </div>
            <div className="actions">
              <Link className="button" href="/posts/new">
                New post
              </Link>
              <Link className="button-secondary" href="/">
                Home
              </Link>
            </div>
          </div>

          <div className="card">
            <div className="toolbar">
              <div className="field">
                <label htmlFor="search">Search</label>
                <input id="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Title, content, tags, author" />
              </div>
              <div className="field">
                <label htmlFor="tag">Tag</label>
                <input id="tag" value={tag} onChange={(event) => setTag(event.target.value)} placeholder="tutorial" />
              </div>
            </div>
            <div className="actions">
              <button className="button" type="button" onClick={() => void loadPosts()}>
                Refresh
              </button>
              <button className="button-secondary" type="button" onClick={handleDeleteSelected} disabled={selectedIds.length === 0}>
                Delete selected
              </button>
              <button className="button-secondary" type="button" onClick={() => handleExport(format)}>
                Export {format.toUpperCase()}
              </button>
              <button className="button-secondary" type="button" onClick={() => setFormat((current) => (current === 'json' ? 'csv' : 'json'))}>
                Format: {format.toUpperCase()}
              </button>
            </div>
            <p className="muted" style={{ marginTop: 10 }}>
              {filteredCount} shown of {totalElements} total post(s), {totalPages} page(s) available.
            </p>
          </div>

          {message ? (
            <div className="notice" style={{ marginTop: 16 }}>
              {message}
            </div>
          ) : null}

          <div className="split" style={{ marginTop: 18 }}>
            <div className="stack-tight">
              <div className="card">
                <h2 style={{ marginTop: 0 }}>Post list</h2>
                {loading ? (
                  <p className="muted">Loading posts...</p>
                ) : posts.length === 0 ? (
                  <p className="muted">No posts found.</p>
                ) : (
                  <div className="post-list">
                    {posts.map((post) => (
                      <div className="post-row" key={post.id}>
                        <input type="checkbox" checked={selectedIds.includes(post.id)} onChange={() => toggleSelected(post.id)} />
                        <div>
                          <h3>{post.title}</h3>
                          <p className="muted" style={{ margin: 0 }}>
                            {post.excerpt || 'No excerpt yet.'}
                          </p>
                          <div className="post-meta">
                            <span className="chip">{post.visibility}</span>
                            {post.tags.slice(0, 3).map((item) => (
                              <span key={item} className="chip chip-muted">
                                {item}
                              </span>
                            ))}
                            {post.authorUsername ? <span className="chip chip-muted">@{post.authorUsername}</span> : null}
                          </div>
                        </div>
                        <div className="actions" style={{ marginTop: 0 }}>
                          <Link className="button-secondary" href={`/posts/${post.id}`}>
                            Open
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="stack-tight">
              <div className="card">
                <h2 style={{ marginTop: 0 }}>Import</h2>
                <div className="field">
                  <label htmlFor="import-format">Format</label>
                  <select id="import-format" value={importFormat} onChange={(event) => setImportFormat(event.target.value as 'json' | 'csv')}>
                    <option value="json">JSON</option>
                    <option value="csv">CSV</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="payload">Payload</label>
                  <textarea
                    id="payload"
                    className="codebox"
                    value={importPayload}
                    onChange={(event) => setImportPayload(event.target.value)}
                    placeholder={importFormat === 'json' ? '[{"title":"Example","content":"<p>Hello</p>"}]' : 'title,content\n"Example","<p>Hello</p>"'}
                  />
                </div>
                <div className="actions">
                  <button className="button" type="button" onClick={() => void handleImport()}>
                    Import
                  </button>
                </div>
              </div>

              <div className="card">
                <h2 style={{ marginTop: 0 }}>Quick export</h2>
                <p className="muted">Export the current author&apos;s posts as JSON or CSV.</p>
                <div className="actions">
                  <button className="button-secondary" type="button" onClick={() => handleExport('json')}>
                    JSON
                  </button>
                  <button className="button-secondary" type="button" onClick={() => handleExport('csv')}>
                    CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}