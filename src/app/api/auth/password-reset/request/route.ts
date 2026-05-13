import { createHash, randomBytes } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/models/User'

const RESET_TTL_MS = 60 * 60 * 1000

export async function POST(req: NextRequest) {
  await connectDB()
  const body = await req.json()
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (!email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 })
  }

  const user = await User.findOne({ email })
  if (!user) {
    return NextResponse.json({ ok: true })
  }

  const resetToken = randomBytes(32).toString('hex')
  user.passwordResetTokenHash = createHash('sha256').update(resetToken).digest('hex')
  user.passwordResetExpiresAt = new Date(Date.now() + RESET_TTL_MS)
  await user.save()

  const response: Record<string, unknown> = { ok: true }
  if (process.env.NODE_ENV !== 'production') {
    response.resetToken = resetToken
  }

  return NextResponse.json(response)
}