import { debugFetch, resolveAuthToken } from '@/utils/auth'

type ErrorPayload = {
  error?: string
  message?: string
  code?: string
  errorCode?: string
}

export async function adminFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = await resolveAuthToken()

  if (!token) {
    return new Response(null, { status: 401, statusText: 'Unauthorized' })
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
    return 'You do not have permission for this action'
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