import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return NextResponse.json({ user: null }, { status: 401 })

  try {
    const payload = await verifyToken(token)
    return NextResponse.json({ user: { id: payload.sub, email: payload.email } })
  } catch (err) {
    return NextResponse.json({ user: null }, { status: 401 })
  }
}
