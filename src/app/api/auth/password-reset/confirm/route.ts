import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import User from '@/models/User'

export async function POST(req: NextRequest) {
  await connectDB()
  const body = await req.json()
  const token = typeof body.token === 'string' ? body.token : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!token || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const tokenHash = createHash('sha256').update(token).digest('hex')
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: { $gt: new Date() },
  })

  if (!user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  user.password = await hashPassword(password)
  user.passwordResetTokenHash = null
  user.passwordResetExpiresAt = null
  await user.save()

  return NextResponse.json({ ok: true })
}