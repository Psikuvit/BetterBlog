const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL

export function apiUrl(path: string): string {
  if (!backendBaseUrl) {
    throw new Error('NEXT_PUBLIC_BACKEND_URL is not set')
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return new URL(normalizedPath, backendBaseUrl).toString()
}