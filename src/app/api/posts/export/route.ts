import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth'
import { postExportHeaders, postsToExportRows, stringifyCsv } from '@/lib/posts'
import Post from '@/models/Post'

export async function GET(req: NextRequest) {
  await connectDB()
  const currentUser = await getAuthenticatedUser(req)
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const searchParams = req.nextUrl.searchParams
  const format = (searchParams.get('format') || 'json').toLowerCase()
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const tags = searchParams.get('tags')?.split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean) ?? []

  const filter: Record<string, unknown> = { author: currentUser._id }
  if (from || to) {
    filter.createdAt = {}
    if (from) (filter.createdAt as Record<string, Date>).$gte = new Date(from)
    if (to) (filter.createdAt as Record<string, Date>).$lte = new Date(to)
  }
  if (tags.length > 0) {
    filter.tags = { $in: tags }
  }

  const posts = await Post.find(filter).sort({ createdAt: -1 }).lean()
  const rows = postsToExportRows(posts)

  if (format === 'csv') {
    const csv = stringifyCsv(rows, postExportHeaders)
    return new NextResponse(csv, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="betterblog-posts.csv"',
      },
    })
  }

  return NextResponse.json({ posts: rows })
}