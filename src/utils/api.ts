const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL

export function apiUrl(path: string): string {
  if (!backendBaseUrl) {
    throw new Error('NEXT_PUBLIC_BACKEND_URL is not set')
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return new URL(normalizedPath, backendBaseUrl).toString()
}

export function getSpringPageItems<T>(
  data: unknown,
  legacyKey?: string,
): T[] {
  if (!data || typeof data !== 'object') return []
  const page = data as Record<string, unknown>
  if (Array.isArray(page.content)) return page.content as T[]
  if (legacyKey && Array.isArray(page[legacyKey])) return page[legacyKey] as T[]
  return []
}

export function getSpringPageTotalPages(data: unknown): number {
  if (!data || typeof data !== 'object') return 1
  const totalPages = (data as { totalPages?: unknown }).totalPages
  return typeof totalPages === 'number' && totalPages > 0 ? totalPages : 1
}