import { NextResponse } from 'next/server'
import { clearAccessCookie, clearRefreshCookie } from '@/lib/auth'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  clearAccessCookie(res)
  clearRefreshCookie(res)
  return res
}
