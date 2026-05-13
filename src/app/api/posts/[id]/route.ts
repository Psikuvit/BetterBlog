import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { Types } from 'mongoose'
import { connectDB } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth'
import { fetchPreview, normalizeTags, normalizeVisibility, serializePost, slugify } from '@/lib/posts'
import Post from '@/models/Post'

const resolvePost = async (idOrSlug: string) => {
  if (Types.ObjectId.isValid(idOrSlug)) {
    const byId = await Post.findById(idOrSlug).populate('author', 'username')
    if (byId) return byId
  }

  return Post.findOne({ slug: idOrSlug }).populate('author', 'username')
}

const ensureUniqueSlug = async (baseSlug: string, currentId?: string) => {
  let candidate = baseSlug || 'post'
  let suffix = 1

  while (await Post.exists({ slug: candidate, ...(currentId ? { _id: { $ne: currentId } } : {}) })) {
    candidate = `${baseSlug || 'post'}-${suffix}`
    suffix += 1
  }

  return candidate
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  await connectDB()
  const currentUser = await getAuthenticatedUser(req)
  const { id } = await context.params
  const post = await resolvePost(id)

  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!currentUser && post.visibility !== 'public') return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ post: serializePost(post) })
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  await connectDB()
  const currentUser = await getAuthenticatedUser(req)
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await context.params
  const post = await resolvePost(id)
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwner = String(post.author?._id ?? post.author) === String(currentUser._id)
  if (!isOwner && currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const title = typeof body.title === 'string' ? body.title.trim() : post.title
  const content = typeof body.content === 'string' ? body.content : post.content
  const excerpt = typeof body.excerpt === 'string' ? body.excerpt.trim() : post.excerpt
  const tags = body.tags !== undefined ? normalizeTags(body.tags) : post.tags
  const visibility = body.visibility !== undefined ? normalizeVisibility(body.visibility) : post.visibility
  const coverImageUrl = typeof body.coverImageUrl === 'string' ? body.coverImageUrl.trim() : post.coverImageUrl
  const sourceUrl = typeof body.sourceUrl === 'string' ? body.sourceUrl.trim() : post.sourceUrl || ''
  const slugInput = typeof body.slug === 'string' ? body.slug.trim() : post.slug
  const nextSlug = await ensureUniqueSlug(slugify(slugInput || title), String(post._id))
  const preview = sourceUrl ? await fetchPreview(sourceUrl).catch(() => null) : null

  post.title = title
  post.content = content
  post.excerpt = excerpt
  post.tags = tags
  post.visibility = visibility
  post.coverImageUrl = coverImageUrl
  post.isPublic = visibility === 'public'
  post.slug = nextSlug
  post.sourceUrl = sourceUrl || null
  post.sourcePreviewTitle = preview?.title || null
  post.sourcePreviewDescription = preview?.description || null
  post.sourcePreviewImage = preview?.image || null
  post.publishedAt = body.publishedAt ? new Date(body.publishedAt) : post.publishedAt
  post.originalAuthor = typeof body.originalAuthor === 'string' ? body.originalAuthor.trim() || null : post.originalAuthor || null
  post.legacyId = typeof body.legacyId === 'string' ? body.legacyId.trim() || null : post.legacyId || null

  await post.save()
  return NextResponse.json({ post: serializePost(post) })
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  await connectDB()
  const currentUser = await getAuthenticatedUser(req)
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await context.params
  const post = await resolvePost(id)
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwner = String(post.author?._id ?? post.author) === String(currentUser._id)
  if (!isOwner && currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await Post.deleteOne({ _id: post._id })
  return NextResponse.json({ ok: true })
}