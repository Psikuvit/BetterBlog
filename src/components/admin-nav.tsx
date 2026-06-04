'use client'

import Link from 'next/link'
import type { UserRole } from '@/utils/roles'

type AdminNavProps = {
  role: UserRole
}

export function AdminNav({ role }: AdminNavProps) {
  const isAdmin = role === 'ADMIN'

  return (
    <div className='actions' style={{ flexWrap: 'wrap' }}>
      <Link className='button-secondary' href='/'>
        Home
      </Link>
      <Link className='button-secondary' href='/admin'>
        Dashboard
      </Link>
      <Link className='button-secondary' href='/admin/posts'>
        Posts
      </Link>
      {isAdmin ? (
        <>
          <Link className='button-secondary' href='/admin/users'>
            Users
          </Link>
          <Link className='button-secondary' href='/admin/moderators'>
            Moderators
          </Link>
          <Link className='button-secondary' href='/admin/activity'>
            Activity
          </Link>
          <Link className='button-secondary' href='/admin/config'>
            Config
          </Link>
        </>
      ) : null}
    </div>
  )
}
