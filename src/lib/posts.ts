import type { IPost, PostVisibility } from '@/models/Post'

type PostLike = Partial<IPost> & {
  _id?: unknown
  author?: unknown
  sourcePreviewTitle?: string | null
  sourcePreviewDescription?: string | null
  sourcePreviewImage?: string | null
}

export type PostPreview = {
  url: string
  title: string
  description: string
  image: string
}

export type PostImportRow = {
  title: string
  slug?: string
  excerpt?: string
  content: string
  tags?: string[]
  visibility?: PostVisibility
  coverImageUrl?: string
  publishedAt?: string | Date | null
  originalAuthor?: string | null
  legacyId?: string | null
  sourceUrl?: string | null
  sourcePreviewTitle?: string | null
  sourcePreviewDescription?: string | null
  sourcePreviewImage?: string | null
}

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const normalizeTags = (value: unknown) => {
  if (!Array.isArray(value)) return []
  return value
    .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
    .filter(Boolean)
    .map((tag) => tag.toLowerCase())
}

export const normalizeVisibility = (value: unknown): PostVisibility => {
  if (value === 'private' || value === 'admin-private') return value
  return 'public'
}

export const serializePost = (post: PostLike) => {
  const author = post.author as { username?: string } | undefined
  return {
    id: String(post._id ?? ''),
    authorId: typeof post.author === 'string' ? post.author : String((post.author as { _id?: unknown })?._id ?? post.author ?? ''),
    authorUsername: author?.username ?? null,
    title: post.title ?? '',
    slug: post.slug ?? '',
    excerpt: post.excerpt ?? '',
    content: post.content ?? '',
    tags: post.tags ?? [],
    visibility: post.visibility ?? 'public',
    coverImageUrl: post.coverImageUrl ?? '',
    isPublic: Boolean(post.isPublic),
    publishedAt: post.publishedAt ?? null,
    sourceUrl: post.sourceUrl ?? null,
    sourcePreviewTitle: post.sourcePreviewTitle ?? null,
    sourcePreviewDescription: post.sourcePreviewDescription ?? null,
    sourcePreviewImage: post.sourcePreviewImage ?? null,
    originalAuthor: post.originalAuthor ?? null,
    legacyId: post.legacyId ?? null,
    importedAt: post.importedAt ?? null,
    createdAt: post.createdAt ?? null,
    updatedAt: post.updatedAt ?? null,
  }
}

const readMeta = (html: string, property: string) => {
  const propertyPattern = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i')
  const contentMatch = html.match(propertyPattern)
  return contentMatch?.[1]?.trim() ?? ''
}

export const extractPreview = (html: string, url: string): PostPreview => {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const ogTitle = readMeta(html, 'og:title')
  const ogDescription = readMeta(html, 'og:description') || readMeta(html, 'description')
  const ogImage = readMeta(html, 'og:image')

  return {
    url,
    title: ogTitle || titleMatch?.[1]?.trim() || url,
    description: ogDescription,
    image: ogImage,
  }
}

export const fetchPreview = async (targetUrl: string) => {
  const response = await fetch(targetUrl, {
    headers: {
      'user-agent': 'BetterBlog Preview Bot/1.0',
      accept: 'text/html,application/xhtml+xml',
    },
  })

  if (!response.ok) {
    throw new Error(`Preview fetch failed with status ${response.status}`)
  }

  const html = await response.text()
  return extractPreview(html, targetUrl)
}

const csvEscape = (value: string) => `"${value.replace(/"/g, '""')}"`

export const stringifyCsv = (rows: Array<Record<string, unknown>>, headers: string[]) => {
  const lines = [headers.join(',')]

  for (const row of rows) {
    lines.push(
      headers
        .map((header) => {
          const value = row[header]
          if (value === null || value === undefined) return '""'
          if (Array.isArray(value)) return csvEscape(value.join('|'))
          if (value instanceof Date) return csvEscape(value.toISOString())
          return csvEscape(String(value))
        })
        .join(','),
    )
  }

  return lines.join('\n')
}

const parseCsvLine = (line: string) => {
  const values: string[] = []
  let current = ''
  let insideQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    const nextCharacter = line[index + 1]

    if (character === '"' && insideQuotes && nextCharacter === '"') {
      current += '"'
      index += 1
      continue
    }

    if (character === '"') {
      insideQuotes = !insideQuotes
      continue
    }

    if (character === ',' && !insideQuotes) {
      values.push(current)
      current = ''
      continue
    }

    current += character
  }

  values.push(current)
  return values.map((value) => value.trim())
}

export const parseCsv = (input: string) => {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) return []

  const headers = parseCsvLine(lines[0])
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    return headers.reduce<Record<string, string>>((row, header, index) => {
      row[header] = values[index] ?? ''
      return row
    }, {})
  })
}

export const postExportHeaders = [
  'title',
  'slug',
  'excerpt',
  'content',
  'tags',
  'visibility',
  'coverImageUrl',
  'publishedAt',
  'originalAuthor',
  'legacyId',
  'sourceUrl',
  'sourcePreviewTitle',
  'sourcePreviewDescription',
  'sourcePreviewImage',
]

export const postsToExportRows = (posts: Array<Record<string, unknown>>) =>
  posts.map((post) => ({
    title: post.title ?? '',
    slug: post.slug ?? '',
    excerpt: post.excerpt ?? '',
    content: post.content ?? '',
    tags: Array.isArray(post.tags) ? post.tags : [],
    visibility: post.visibility ?? 'public',
    coverImageUrl: post.coverImageUrl ?? '',
    publishedAt: post.publishedAt ?? '',
    originalAuthor: post.originalAuthor ?? '',
    legacyId: post.legacyId ?? '',
    sourceUrl: post.sourceUrl ?? '',
    sourcePreviewTitle: post.sourcePreviewTitle ?? '',
    sourcePreviewDescription: post.sourcePreviewDescription ?? '',
    sourcePreviewImage: post.sourcePreviewImage ?? '',
  }))

export const parseImportRow = (row: Record<string, string>): PostImportRow => ({
  title: row.title?.trim() ?? '',
  slug: row.slug?.trim() || undefined,
  excerpt: row.excerpt?.trim() || '',
  content: row.content ?? '',
  tags: row.tags ? row.tags.split('|').map((tag) => tag.trim()).filter(Boolean) : [],
  visibility: normalizeVisibility(row.visibility),
  coverImageUrl: row.coverImageUrl?.trim() || '',
  publishedAt: row.publishedAt ? new Date(row.publishedAt) : null,
  originalAuthor: row.originalAuthor?.trim() || null,
  legacyId: row.legacyId?.trim() || null,
  sourceUrl: row.sourceUrl?.trim() || null,
  sourcePreviewTitle: row.sourcePreviewTitle?.trim() || null,
  sourcePreviewDescription: row.sourcePreviewDescription?.trim() || null,
  sourcePreviewImage: row.sourcePreviewImage?.trim() || null,
})
