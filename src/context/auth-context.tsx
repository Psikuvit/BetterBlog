'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

export type AuthUser = {
  id: string
  username: string
  email: string
  bio: string
  avatarUrl: string
  role: string
  preferences: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<AuthUser>
  logout: () => Promise<void>
  refreshSession: () => Promise<AuthUser | null>
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)
const REFRESH_INTERVAL_MS = 15 * 60 * 1000

const readErrorMessage = async (response: Response, fallback: string) => {
  try {
    const data = await response.json()
    return typeof data?.error === 'string' ? data.error : fallback
  } catch {
    return fallback
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const refreshTimer = useRef<number | null>(null)

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimer.current !== null) {
      window.clearInterval(refreshTimer.current)
      refreshTimer.current = null
    }
  }, [])

  const authFetch = useCallback((input: RequestInfo | URL, init: RequestInit = {}) => {
    return fetch(input, { ...init, credentials: 'include' })
  }, [])

  const fetchCurrentUser = useCallback(async () => {
    const response = await authFetch('/api/auth/me')
    if (response.ok) {
      const data = await response.json()
      const nextUser = (data?.user ?? null) as AuthUser | null
      setUser(nextUser)
      return nextUser
    }

    if (response.status === 401) {
      setUser(null)
      return null
    }

    throw new Error('Failed to load session')
  }, [authFetch])

  const refreshSession = useCallback(async () => {
    const response = await authFetch('/api/auth/refresh', { method: 'POST' })
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'Refresh failed'))
    }

    return fetchCurrentUser()
  }, [authFetch, fetchCurrentUser])

  const syncSession = useCallback(async () => {
    try {
      const currentUser = await fetchCurrentUser()
      if (currentUser) return currentUser
      return await refreshSession()
    } catch {
      setUser(null)
      return null
    }
  }, [fetchCurrentUser, refreshSession])

  const startRefreshLoop = useCallback(() => {
    clearRefreshTimer()
    refreshTimer.current = window.setInterval(() => {
      refreshSession().catch(() => {
        setUser(null)
      })
    }, REFRESH_INTERVAL_MS)
  }, [clearRefreshTimer, refreshSession])

  useEffect(() => {
    let active = true

    void (async () => {
      setLoading(true)
      try {
        await syncSession()
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
      clearRefreshTimer()
    }
  }, [clearRefreshTimer, syncSession])

  useEffect(() => {
    if (!user) {
      clearRefreshTimer()
      return
    }

    startRefreshLoop()
    return clearRefreshTimer
  }, [clearRefreshTimer, startRefreshLoop, user])

  const login = useCallback(
    async (email: string, password: string, rememberMe = false) => {
      const response = await authFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      })

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Login failed'))
      }

      const data = await response.json()
      const nextUser = data?.user as AuthUser | undefined
      if (!nextUser) {
        throw new Error('Login failed')
      }

      setUser(nextUser)
      return nextUser
    },
    [authFetch],
  )

  const logout = useCallback(async () => {
    try {
      await authFetch('/api/auth/logout', { method: 'POST' })
    } finally {
      setUser(null)
      clearRefreshTimer()
    }
  }, [authFetch, clearRefreshTimer])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      refreshSession,
      authFetch,
    }),
    [authFetch, loading, login, logout, refreshSession, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}