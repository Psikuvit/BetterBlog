'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  getSessionRole,
  isAdminOnlyPath,
  isStaffRole,
  type UserRole,
} from '@/utils/roles'

type StaffAccessOptions = {
  adminOnly?: boolean
}

export function useStaffAccess(options: StaffAccessOptions = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const [role, setRole] = useState<UserRole | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true

    const checkAccess = async () => {
      const nextRole = await getSessionRole()

      if (!active) return

      if (!isStaffRole(nextRole)) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
        return
      }

      if (
        (options.adminOnly || isAdminOnlyPath(pathname)) &&
        nextRole !== 'ADMIN'
      ) {
        router.replace('/admin/posts')
        return
      }

      setRole(nextRole)
      setReady(true)
    }

    void checkAccess()

    return () => {
      active = false
    }
  }, [options.adminOnly, pathname, router])

  return {
    ready,
    role,
    isAdmin: role === 'ADMIN',
    isModerator: role === 'MODERATOR',
  }
}
