import { debugFetch, getClientAuthToken } from '@/utils/auth'

type ErrorPayload = {
  error?: string
  message?: string
  code?: string
  errorCode?: string
}

export function getAdminAccessToken(): string | null {
  return getClientAuthToken()
}

export async function adminFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = getClientAuthToken()

  if (!token) {
    throw new Error('Missing admin access token')
  }

  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)

  return debugFetch(input, {
    ...init,
    headers,
  })
}

export function getAdminErrorMessage(response: Response, payload: unknown): string {
  if (response.status === 401) {
    return 'Session expired. Please log in again.'
  }

  if (response.status === 403) {
    return 'Admin access required'
  }

  if (response.status === 404) {
    return 'Resource not found'
  }

  if (response.status === 400) {
    return 'Invalid request'
  }

  if (payload && typeof payload === 'object') {
    const errorPayload = payload as ErrorPayload
    return errorPayload.message || errorPayload.error || 'Request failed'
  }

  return 'Request failed'
}