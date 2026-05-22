export const ACCESS_TOKEN_COOKIE = 'betterblog_access_token'
export const REFRESH_TOKEN_COOKIE = 'betterblog_refresh_token'

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
