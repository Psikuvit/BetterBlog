import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyToken, signAccessToken, signRefreshToken } from '@/lib/jwt'

const REFRESH_COOKIE = 'bb_refresh'

function parseCookies(cookieHeader: string | null) {
  const out: Record<string, string> = {}
  if (!cookieHeader) return out
  for (const pair of cookieHeader.split(';')) {
    const [k, ...v] = pair.split('=')
    out[k.trim()] = decodeURIComponent(v.join('='))
  }
  return out
}

export async function POST(req: NextRequest) {
  const cookies = parseCookies(req.headers.get('cookie'))
  const token = cookies[REFRESH_COOKIE]
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 })

  try {
    const payload = await verifyToken(token)
    const accessToken = await signAccessToken({ sub: String(payload.sub), email: payload.email as string })
    const refreshToken = await signRefreshToken({ sub: String(payload.sub), email: payload.email as string })
    const res = NextResponse.json({ accessToken })
    res.headers.set('Set-Cookie', `${REFRESH_COOKIE}=${refreshToken}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict`)
    return res
  } catch (err) {
    return NextResponse.json({ error: 'Invalid' }, { status: 401 })
  }
}
