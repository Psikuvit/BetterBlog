export const ACCESS_TOKEN_COOKIE = 'betterblog_access_token'
export const REFRESH_TOKEN_COOKIE = 'betterblog_refresh_token'

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  LOGIN_IDENTIFIER_REQUIRED: 'Enter your email or username.',
  USER_NOT_FOUND: 'No account matches those credentials.',
  USER_DISABLED: 'This account is disabled.',
  INVALID_PASSWORD: 'Incorrect password.',
  INVALID_TOKEN: 'Your session is no longer valid. Please log in again.',
  VALIDATION_FAILED: 'Please check the form for missing or invalid fields.',
  ALREADY_EXISTS: 'An account with those details already exists.',
  RATE_LIMIT_EXCEEDED: 'Too many attempts. Please try again later.',
  INTERNAL_SERVER_ERROR: 'The server hit an error. Try again in a moment.',
}

const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30

function buildCookie(name: string, value: string, maxAgeSeconds?: number): string {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'path=/', 'sameSite=lax']

  if (maxAgeSeconds !== undefined) {
    parts.push(`max-age=${maxAgeSeconds}`)
  }

  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    parts.push('secure')
  }

  return parts.join('; ')
}

export function setAuthSession(token: string, refreshToken?: string, rememberMe = false): void {
  if (typeof document === 'undefined') {
    return
  }

  const maxAgeSeconds = rememberMe ? THIRTY_DAYS_IN_SECONDS : undefined
  document.cookie = buildCookie(ACCESS_TOKEN_COOKIE, token, maxAgeSeconds)

  if (refreshToken) {
    document.cookie = buildCookie(REFRESH_TOKEN_COOKIE, refreshToken, maxAgeSeconds)
  }
}

export function clearAuthSession(): void {
  if (typeof document === 'undefined') {
    return
  }

  document.cookie = `${ACCESS_TOKEN_COOKIE}=; path=/; max-age=0; sameSite=lax`
  document.cookie = `${REFRESH_TOKEN_COOKIE}=; path=/; max-age=0; sameSite=lax`
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null
  }

  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function getClientAuthToken(): string | null {
  return readCookie(ACCESS_TOKEN_COOKIE)
}

function getBodyPreview(body: RequestInit['body']): string {
  if (typeof body === 'string') {
    return body
  }

  if (body instanceof URLSearchParams) {
    return body.toString()
  }

  return body ? '[non-string body]' : ''
}

export async function debugFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const method = (init.method || 'GET').toUpperCase()
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
  const headers = new Headers(init.headers)

  console.log('[request]', {
    method,
    url,
    headers: Object.fromEntries(headers.entries()),
    body: getBodyPreview(init.body) || undefined,
  })

  return fetch(input, init)
}

type ApiErrorPayload = {
  code?: string
  errorCode?: string
  error?: string
  message?: string
}

export function getAuthErrorMessage(payload: unknown, fallback = 'Request failed'): string {
  if (!payload || typeof payload !== 'object') {
    return fallback
  }

  const errorPayload = payload as ApiErrorPayload
  const code = errorPayload.code || errorPayload.errorCode || errorPayload.error

  if (code && AUTH_ERROR_MESSAGES[code]) {
    return AUTH_ERROR_MESSAGES[code]
  }

  return errorPayload.message || errorPayload.error || fallback
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  const token = getClientAuthToken()

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return debugFetch(input, {
    ...init,
    headers,
  })
}

