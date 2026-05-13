import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { Types } from 'mongoose'
import { connectDB } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth'
import { fetchPreview, normalizeTags, normalizeVisibility, serializePost, slugify } from '@/lib/posts'
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

export async function GET(req: NextRequest) {
  await connectDB()
  const currentUser = await getAuthenticatedUser(req)
  const searchParams = req.nextUrl.searchParams
  const q = searchParams.get('q')?.trim().toLowerCase() || ''
  const tag = searchParams.get('tag')?.trim().toLowerCase() || ''
  const authorUsername = searchParams.get('author')?.trim().toLowerCase() || ''

  const baseFilter = currentUser ? {} : { visibility: 'public' }

  const posts = await Post.find(baseFilter).populate('author', 'username').sort({ publishedAt: -1, createdAt: -1 }).lean()

  const filteredPosts = posts.filter((post) => {
    const author = post.author as { username?: string } | undefined
    const textParts = [post.title, post.excerpt, post.content, ...(post.tags ?? []), author?.username ?? '']
      .join(' ')
      .toLowerCase()

    if (q && !textParts.includes(q)) return false
    if (tag && !(post.tags ?? []).some((entry) => String(entry).toLowerCase() === tag)) return false
    if (authorUsername && String(author?.username ?? '').toLowerCase() !== authorUsername) return false
    return true
  })

  return NextResponse.json({ posts: filteredPosts.map((post) => serializePost(post)) })
}

export async function POST(req: NextRequest) {
  await connectDB()
  const currentUser = await getAuthenticatedUser(req)
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const content = typeof body.content === 'string' ? body.content : ''
  const excerpt = typeof body.excerpt === 'string' ? body.excerpt.trim() : ''
  const tags = normalizeTags(body.tags)
  const visibility = normalizeVisibility(body.visibility)
  const coverImageUrl = typeof body.coverImageUrl === 'string' ? body.coverImageUrl.trim() : ''
  const sourceUrl = typeof body.sourceUrl === 'string' ? body.sourceUrl.trim() : ''
  const slugInput = typeof body.slug === 'string' ? body.slug.trim() : ''

  if (!title || !content) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const baseSlug = slugify(slugInput || title)
  const slug = await ensureUniqueSlug(baseSlug)
  const now = new Date()
  const preview = sourceUrl ? await fetchPreview(sourceUrl).catch(() => null) : null
  const publishedAt = body.publishedAt ? new Date(body.publishedAt) : visibility === 'public' ? now : null

  const post = await Post.create({
    author: currentUser._id,
    title,
    slug,
    excerpt,
    content,
    tags,
    visibility,
    coverImageUrl,
    isPublic: visibility === 'public',
    publishedAt,
    sourceUrl: sourceUrl || null,
    sourcePreviewTitle: preview?.title || null,
    sourcePreviewDescription: preview?.description || null,
    sourcePreviewImage: preview?.image || null,
    originalAuthor: typeof body.originalAuthor === 'string' ? body.originalAuthor.trim() || null : null,
    legacyId: typeof body.legacyId === 'string' ? body.legacyId.trim() || null : null,
    importedAt: null,
  })

  return NextResponse.json({ post: serializePost(post) }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  await connectDB()
  const currentUser = await getAuthenticatedUser(req)
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const ids = Array.isArray(body.ids) ? body.ids.filter((value) => typeof value === 'string' && Types.ObjectId.isValid(value)) : []

  if (ids.length === 0) {
    return NextResponse.json({ error: 'Missing ids' }, { status: 400 })
  }

  const filter = currentUser.role === 'admin'
    ? { _id: { $in: ids.map((id) => new Types.ObjectId(id)) } }
    : { _id: { $in: ids.map((id) => new Types.ObjectId(id)) }, author: currentUser._id }

  const result = await Post.deleteMany(filter)
  return NextResponse.json({ deletedCount: result.deletedCount })
}