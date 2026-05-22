'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { getSessionPreview, getSessionUser } from '@/utils/auth'

export function SessionBadge() {
  const [user, setUser] = useState<NonNullable<Awaited<ReturnType<typeof getSessionUser>>> | null>(null)
  const [loading, setLoading] = useState(true)

  const sessionPreview = getSessionPreview()

  useEffect(() => {
    let active = true

    const loadUser = async () => {
      try {
        if (active) {
          setUser(await getSessionUser())
        }
      } catch {
        if (active) {
          setUser(null)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadUser()

    return () => {
      active = false
    }
  }, [])

  const avatarLabel = user?.displayName || user?.username || 'Member'
  const avatarInitials = avatarLabel
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  if (loading) {
    return sessionPreview ? <p className="muted">Signed in as {sessionPreview.username || sessionPreview.subject || 'Member'}</p> : <p className="muted">Checking session...</p>
  }

  if (!user) {
    if (sessionPreview) {
      return <p className="muted">Signed in as {sessionPreview.username || sessionPreview.subject || 'Member'}</p>
    }

    return <p className="muted">No active session detected.</p>
  }

  return (
    <span
      className="button-secondary"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 10, pointerEvents: 'none' }}
      aria-label={`Logged in as ${avatarLabel}`}
    >
      {user.avatarUrl ? (
        <Image src={user.avatarUrl} alt={avatarLabel} width={24} height={24} style={{ borderRadius: 9999, objectFit: 'cover' }} />
      ) : (
        <span
          aria-hidden="true"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            borderRadius: 9999,
            background: 'rgba(30, 27, 24, 0.12)',
            color: 'inherit',
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {avatarInitials || 'M'}
        </span>
      )}
      <span>
        {avatarLabel}
        <span className="muted" style={{ marginLeft: 8 }}>
          Online
        </span>
      </span>
    </span>
  )
}
