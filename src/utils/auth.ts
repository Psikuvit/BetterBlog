import { apiUrl } from '@/utils/api'

export const ACCESS_TOKEN_STORAGE_KEY = 'betterblog_access_token'
export const REFRESH_TOKEN_STORAGE_KEY = 'betterblog_refresh_token'

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

export function setAuthSession(token: string, refreshToken?: string, rememberMe = false): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token)

  if (refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken)
  } else {
    window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
  }
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
  window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
}

function readStoredValue(name: string): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(name)
}

export function getClientAuthToken(): string | null {
  return readStoredValue(ACCESS_TOKEN_STORAGE_KEY)
}

export function getClientRefreshToken(): string | null {
  return readStoredValue(REFRESH_TOKEN_STORAGE_KEY)
}

export type SessionPreview = {
  username?: string | null
  subject?: string | null
}

export type SessionUser = {
  username?: string | null
  avatarUrl?: string | null
  displayName?: string | null
  email?: string | null
}

type SessionUserPayload = {
  user?: SessionUser | null
  data?: SessionUser | null
  currentUser?: SessionUser | null
  profile?: SessionUser | null
}

let cachedSessionUser: SessionUser | null | undefined
let cachedSessionToken: string | null | undefined
let sessionUserPromise: Promise<SessionUser | null> | null = null

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4)
  return atob(normalized + padding)
}

export function getSessionPreview(): SessionPreview | null {
  const token = getClientAuthToken()

  if (!token) {
    return null
  }

  const parts = token.split('.')
  if (parts.length < 2) {
    return null
  }

  try {
    const payload = JSON.parse(decodeBase64Url(parts[1])) as { username?: string; sub?: string }
    return {
      username: payload.username || null,
      subject: payload.sub || null,
    }
  } catch {
    return null
  }
}

export function clearSessionUserCache(): void {
  cachedSessionUser = undefined
  cachedSessionToken = undefined
  sessionUserPromise = null
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = await resolveAuthToken()

  if (!token) {
    clearSessionUserCache()
    return null
  }

  if (cachedSessionToken === token && cachedSessionUser !== undefined) {
    return cachedSessionUser
  }

  if (sessionUserPromise && cachedSessionToken === token) {
    return sessionUserPromise
  }

  cachedSessionToken = token
  sessionUserPromise = (async () => {
    try {
      const response = await debugFetch(apiUrl('/api/auth/me'), {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        cachedSessionUser = null
        return null
      }

      const data = (await response.json().catch(() => null)) as SessionUserPayload | null
      cachedSessionUser = data?.user ?? data?.data ?? data?.currentUser ?? data?.profile ?? (data as SessionUser | null) ?? null
      return cachedSessionUser
    } catch {
      cachedSessionUser = null
      return null
    } finally {
      sessionUserPromise = null
    }
  })()

  return sessionUserPromise
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

export async function resolveAuthToken(): Promise<string | null> {
  const accessToken = getClientAuthToken()

  if (accessToken) {
    return accessToken
  }

  const refreshToken = getClientRefreshToken()

  if (!refreshToken || typeof window === 'undefined') {
    return null
  }

  try {
    const response = await debugFetch(apiUrl('/api/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      clearAuthSession()
      return null
    }

    const nextAccessToken = data?.token ?? data?.accessToken ?? data?.jwt ?? data?.access_token
    const nextRefreshToken = data?.refreshToken ?? data?.refresh_token

    if (!nextAccessToken) {
      clearAuthSession()
      return null
    }

    setAuthSession(String(nextAccessToken), nextRefreshToken ? String(nextRefreshToken) : refreshToken)
    return String(nextAccessToken)
  } catch {
    return null
  }
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  const token = await resolveAuthToken()

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return debugFetch(input, {
    ...init,
    headers,
  })
}

