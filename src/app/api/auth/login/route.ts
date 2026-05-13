import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import {connectDB} from '@/lib/db'
import User from '@/models/User'
import { verifyPassword } from '@/lib/password'
import { signAccessToken, signRefreshToken } from '@/lib/jwt'
import { sanitizeAuthUser, setRefreshCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  await connectDB()
  const body = await req.json()
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const rememberMe = Boolean(body.rememberMe)

  if (!email || !password) return NextResponse.json({ error: 'Missing' }, { status: 400 })

  const user = await User.findOne({ email })
  if (!user) return NextResponse.json({ error: 'Invalid' }, { status: 401 })

  const ok = await verifyPassword(password, user.password)
  if (!ok) return NextResponse.json({ error: 'Invalid' }, { status: 401 })

  const accessToken = await signAccessToken({ sub: String(user._id), email: user.email })
  const refreshToken = await signRefreshToken({ sub: String(user._id), email: user.email, rememberMe })

  const res = NextResponse.json({ accessToken, user: sanitizeAuthUser(user), rememberMe })
  setRefreshCookie(res, refreshToken, rememberMe)
  return res
}
