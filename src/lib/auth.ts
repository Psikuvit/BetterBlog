import type { NextRequest, NextResponse } from 'next/server'
import type { Types } from 'mongoose'
import { connectDB } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'
import User from '@/models/User'

export const REFRESH_COOKIE = 'bb_refresh'

type UserShape = {
  _id: Types.ObjectId | string
  username: string
  email: string
  bio: string
  avatarUrl: string
  role: string
  preferences: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export const sanitizeAuthUser = (user: UserShape) => ({
  id: String(user._id),
  username: user.username,
  email: user.email,
  bio: user.bio,
  avatarUrl: user.avatarUrl,
  role: user.role,
  preferences: user.preferences,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
})

export const sanitizePublicProfile = (user: UserShape) => ({
  id: String(user._id),
  username: user.username,
  bio: user.bio,
  avatarUrl: user.avatarUrl,
  preferences: user.preferences,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
})

export const getTokenFromRequest = (req: NextRequest) => {
  const authHeader = req.headers.get('authorization') || ''
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7)
  return req.cookies.get('bb_access')?.value || null
}

export const getAuthenticatedUser = async (req: NextRequest) => {
  await connectDB()
  const token = getTokenFromRequest(req)
  if (!token) return null

  const payload = await verifyToken(token)
  return User.findById(payload.sub)
}

export const setRefreshCookie = (res: NextResponse, token: string, rememberMe: boolean) => {
  const options = {
    httpOnly: true,
    path: '/',
    sameSite: 'strict' as const,
  }

  if (rememberMe) {
    res.cookies.set(REFRESH_COOKIE, token, {
      ...options,
      maxAge: 30 * 24 * 60 * 60,
    })
    return
  }

  res.cookies.set(REFRESH_COOKIE, token, options)
}

export const clearRefreshCookie = (res: NextResponse) => {
  res.cookies.set(REFRESH_COOKIE, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'strict',
    maxAge: 0,
  })
}