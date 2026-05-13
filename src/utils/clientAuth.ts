let refreshInterval: number | null = null

const ACCESS_KEY = 'bb_access'
const SESSION_ACCESS_KEY = 'bb_access_session'

export const setAccessToken = (token: string | null, rememberMe = false) => {
  localStorage.removeItem(ACCESS_KEY)
  sessionStorage.removeItem(SESSION_ACCESS_KEY)

  if (token) {
    if (rememberMe) localStorage.setItem(ACCESS_KEY, token)
    else sessionStorage.setItem(SESSION_ACCESS_KEY, token)
  }
}

export const getAccessToken = () => {
  return sessionStorage.getItem(SESSION_ACCESS_KEY) || localStorage.getItem(ACCESS_KEY)
}

export const login = async (email: string, password: string, rememberMe = false) => {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, rememberMe }),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Login failed')
  const data = await res.json()
  setAccessToken(data.accessToken, rememberMe)
  startAutoRefresh()
  return data
}

export const logout = async () => {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
  setAccessToken(null)
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

export const refresh = async () => {
  const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
  if (!res.ok) throw new Error('Refresh failed')
  const data = await res.json()
  setAccessToken(data.accessToken, Boolean(localStorage.getItem(ACCESS_KEY)))
  return data.accessToken
}

export const startAutoRefresh = () => {
  // refresh every 15 minutes
  if (refreshInterval) return
  refreshInterval = setInterval(() => {
    refresh().catch(() => {
      // ignore
    })
  }, 15 * 60 * 1000) as unknown as number
}
