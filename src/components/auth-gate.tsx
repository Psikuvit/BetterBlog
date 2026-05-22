'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { clearAuthSession, getClientAuthToken, resolveAuthToken } from '@/utils/auth'

const PUBLIC_PATHS = ['/login', '/register', '/reset-password']

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname)
}

export function AuthGate({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname()
  const router = useRouter()
  const [validatedPath, setValidatedPath] = useState('')

  useEffect(() => {
    let active = true

    const validate = async () => {
      if (isPublicPath(pathname)) {
        if (active) {
          setValidatedPath(pathname)
        }
        return
      }

      const token = getClientAuthToken() || (await resolveAuthToken())

      if (!token) {
        clearAuthSession()
        router.replace('/login?redirect=' + encodeURIComponent(pathname))
        return
      }

      if (active) {
        setValidatedPath(pathname)
      }
    }

    void validate()

    return () => {
      active = false
    }
  }, [pathname, router])

  if (!isPublicPath(pathname) && validatedPath !== pathname) {
    return (
      <main className="shell">
        <section className="panel">
          <div className="panel-inner">
            <p className="muted">Checking session...</p>
          </div>
        </section>
      </main>
    )
  }

  return children
}
