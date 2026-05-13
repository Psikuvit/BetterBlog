import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getAuthenticatedUser, sanitizeAuthUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  return NextResponse.json({ user: sanitizeAuthUser(user) })
}

export async function PATCH(req: NextRequest) {
  await connectDB()
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const updates: Record<string, unknown> = {}

  if (typeof body.bio === 'string') updates.bio = body.bio
  if (typeof body.avatarUrl === 'string') updates.avatarUrl = body.avatarUrl
  if (body.preferences && typeof body.preferences === 'object' && !Array.isArray(body.preferences)) {
    updates.preferences = body.preferences as Record<string, unknown>
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
  }

  Object.assign(user, updates)
  await user.save()

  return NextResponse.json({ user: sanitizeAuthUser(user) })
}