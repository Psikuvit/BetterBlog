import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getAuthenticatedUser, sanitizePublicProfile } from '@/lib/auth'
import Post from '@/models/Post'
import User from '@/models/User'

export async function GET(req: NextRequest, context: { params: Promise<{ username: string }> }) {
  await connectDB()
  const currentUser = await getAuthenticatedUser(req)
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { username } = await context.params
  const user = await User.findOne({ username })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const posts = await Post.find({
    author: user._id,
    isPublic: true,
  })
    .sort({ publishedAt: -1, createdAt: -1 })
    .select('title slug excerpt content publishedAt createdAt updatedAt')
    .lean()

  return NextResponse.json({
    profile: sanitizePublicProfile(user),
    isOwnProfile: String(currentUser._id) === String(user._id),
    posts,
  })
}