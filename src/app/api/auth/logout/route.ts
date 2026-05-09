import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const REFRESH_COOKIE = 'bb_refresh'

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true })
  res.headers.set('Set-Cookie', `${REFRESH_COOKIE}=deleted; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`)
  return res
}
