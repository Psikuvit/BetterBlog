import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import User from '@/models/User'
import { hashPassword } from '@/lib/password'

export async function POST(req: NextRequest) {
  await connectDB()
  const body = await req.json()
  const { name, email, password } = body
  if (!email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const existing = await User.findOne({ email })
  if (existing) return NextResponse.json({ error: 'User exists' }, { status: 409 })

  const hashed = await hashPassword(password)
  const user = await User.create({ name, email, password: hashed })
  return NextResponse.json({ id: user._id, email: user.email })
}
