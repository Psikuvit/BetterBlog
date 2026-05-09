import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import User from '@/models/User'
import { verifyPassword } from '@/lib/password'
import { signAccessToken, signRefreshToken } from '@/lib/jwt'

const REFRESH_COOKIE = 'bb_refresh'

export async function POST(req: NextRequest) {
  await connectDB()
  const { email, password } = await req.json()
  if (!email || !password) return NextResponse.json({ error: 'Missing' }, { status: 400 })

  const user = await User.findOne({ email })
  if (!user) return NextResponse.json({ error: 'Invalid' }, { status: 401 })

  const ok = await verifyPassword(password, user.password)
  if (!ok) return NextResponse.json({ error: 'Invalid' }, { status: 401 })

  const accessToken = await signAccessToken({ sub: String(user._id), email: user.email })
  const refreshToken = await signRefreshToken({ sub: String(user._id), email: user.email })

  const res = NextResponse.json({ accessToken })
  res.headers.set('Set-Cookie', `${REFRESH_COOKIE}=${refreshToken}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict`)
  return res
}
