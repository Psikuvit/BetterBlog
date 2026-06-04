import { getClientAuthToken, getSessionUser } from '@/utils/auth'

export type UserRole = 'USER' | 'MODERATOR' | 'ADMIN'

export function normalizeRole(value: unknown): UserRole {
  const role = String(value ?? 'USER').toUpperCase()
  if (role === 'ADMIN') return 'ADMIN'
  if (role === 'MODERATOR') return 'MODERATOR'
  return 'USER'
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length < 2) return null

  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padding = '='.repeat((4 - (normalized.length % 4)) % 4)
    return JSON.parse(atob(normalized + padding)) as Record<string, unknown>
  } catch {
    return null
  }
}

function roleFromJwt(token: string): UserRole | null {
  const payload = decodeJwtPayload(token)
  if (!payload) return null

  if (payload.role) return normalizeRole(payload.role)

  const authorities = payload.authorities
  if (Array.isArray(authorities)) {
    const values = authorities.map(String)
    if (values.some((item) => item.includes('ADMIN'))) return 'ADMIN'
    if (values.some((item) => item.includes('MODERATOR'))) return 'MODERATOR'
  }

  return null
}

export async function getSessionRole(): Promise<UserRole | null> {
  const user = await getSessionUser()
  if (user?.role) return normalizeRole(user.role)

  const token = getClientAuthToken()
  if (!token) return null

  return roleFromJwt(token)
}

export function isStaffRole(role: UserRole | null): role is 'ADMIN' | 'MODERATOR' {
  return role === 'ADMIN' || role === 'MODERATOR'
}

export const ADMIN_ONLY_PATHS = [
  '/admin/users',
  '/admin/moderators',
  '/admin/activity',
  '/admin/config',
] as const

export function isAdminOnlyPath(pathname: string): boolean {
  return ADMIN_ONLY_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  )
}
