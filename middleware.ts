import { NextResponse, type NextRequest } from 'next/server'
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "./src/utils/auth"

const PUBLIC_PATHS = ['/login', '/register', '/reset-password']

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname)
}

async function verifyAuthToken(token: string): Promise<boolean> {
  const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL

  if (!backendBaseUrl) {
    return false
  }

  const authResponse = await fetch(new URL('/api/auth/me', backendBaseUrl), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  })

  return authResponse.ok
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value
  const sessionToken = accessToken || refreshToken

  if (!sessionToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

  const isValid = await verifyAuthToken(sessionToken)

  if (isValid) {
    return NextResponse.next()
  }

  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('redirect', `${pathname}${search}`)
  const response = NextResponse.redirect(loginUrl)
  response.cookies.delete(ACCESS_TOKEN_COOKIE)
  response.cookies.delete(REFRESH_TOKEN_COOKIE)
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
}
