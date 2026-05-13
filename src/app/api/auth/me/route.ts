import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getTokenFromRequest, sanitizeAuthUser } from '@/lib/auth'
import { verifyToken } from '@/lib/jwt'
import User from '@/models/User'

export async function GET(req: NextRequest) {
  await connectDB()
  const token = getTokenFromRequest(req)
  if (!token) return NextResponse.json({ user: null }, { status: 401 })

  try {
    const payload = await verifyToken(token)
    const user = await User.findById(payload.sub)
    if (!user) return NextResponse.json({ user: null }, { status: 401 })
    return NextResponse.json({ user: sanitizeAuthUser(user) })
  } catch {
    return NextResponse.json({ user: null }, { status: 401 })
  }
}
