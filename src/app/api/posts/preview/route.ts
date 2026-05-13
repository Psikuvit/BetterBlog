import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { fetchPreview } from '@/lib/posts'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const urlValue = typeof body.url === 'string' ? body.url.trim() : ''

  if (!urlValue) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 })
  }

  try {
    const url = new URL(urlValue)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
    }

    const preview = await fetchPreview(url.toString())
    return NextResponse.json({ preview })
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
  }
}