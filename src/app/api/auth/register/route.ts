import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import {connectDB} from '@/lib/db'
import User from '@/models/User'
import { hashPassword } from '@/lib/password'
import { sanitizeAuthUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  await connectDB()
  const body = await req.json()
  const username = typeof body.username === 'string' ? body.username.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!username || !email || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const existingEmail = await User.findOne({ email })
  if (existingEmail) return NextResponse.json({ error: 'User exists' }, { status: 409 })

  const existingUsername = await User.findOne({ username })
  if (existingUsername) return NextResponse.json({ error: 'Username taken' }, { status: 409 })

  const hashed = await hashPassword(password)
  const user = await User.create({ username, email, password: hashed })
  return NextResponse.json({ user: sanitizeAuthUser(user) }, { status: 201 })
}
