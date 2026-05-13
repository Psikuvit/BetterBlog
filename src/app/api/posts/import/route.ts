import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth'
import { fetchPreview, parseCsv, parseImportRow, slugify, normalizeTags, normalizeVisibility, serializePost } from '@/lib/posts'
import Post from '@/models/Post'

const ensureUniqueSlug = async (baseSlug: string) => {
  let candidate = baseSlug || 'post'
  let suffix = 1

  while (await Post.exists({ slug: candidate })) {
    candidate = `${baseSlug || 'post'}-${suffix}`
    suffix += 1
  }

  return candidate
}

export async function POST(req: NextRequest) {
  await connectDB()
  const currentUser = await getAuthenticatedUser(req)
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const format = String(body.format || 'json').toLowerCase()
  const payload = body.payload

  let rows: Array<Record<string, string>> = []

  if (format === 'csv') {
    if (typeof payload !== 'string') return NextResponse.json({ error: 'Missing csv payload' }, { status: 400 })
    rows = parseCsv(payload)
  } else {
    const data = typeof payload === 'string' ? JSON.parse(payload) : payload
    if (!Array.isArray(data)) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    rows = data.map((row) =>
      Object.fromEntries(
        Object.entries(row as Record<string, unknown>).map(([key, value]) => [key, Array.isArray(value) ? value.join('|') : String(value ?? '')]),
      ),
    )
  }

  const insertedPosts = [] as Array<Record<string, unknown>>

  for (const row of rows) {
    const input = parseImportRow(row)
    if (!input.title || !input.content) continue

    const slug = await ensureUniqueSlug(slugify(input.slug || input.title))
    const sourcePreview = input.sourceUrl ? await fetchPreview(input.sourceUrl).catch(() => null) : null
    const createdPost = await Post.create({
      author: currentUser._id,
      title: input.title,
      slug,
      excerpt: input.excerpt || '',
      content: input.content,
      tags: normalizeTags(input.tags),
      visibility: normalizeVisibility(input.visibility),
      coverImageUrl: input.coverImageUrl || '',
      isPublic: normalizeVisibility(input.visibility) === 'public',
      publishedAt: input.publishedAt || null,
      originalAuthor: input.originalAuthor || null,
      legacyId: input.legacyId || null,
      sourceUrl: input.sourceUrl || null,
      sourcePreviewTitle: input.sourcePreviewTitle || sourcePreview?.title || null,
      sourcePreviewDescription: input.sourcePreviewDescription || sourcePreview?.description || null,
      sourcePreviewImage: input.sourcePreviewImage || sourcePreview?.image || null,
      importedAt: new Date(),
    })

    insertedPosts.push(serializePost(createdPost))
  }

  return NextResponse.json({ importedCount: insertedPosts.length, posts: insertedPosts })
}