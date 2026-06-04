'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AdminNav } from '@/components/admin-nav'
import { useStaffAccess } from '@/hooks/use-staff-access'
import { apiUrl } from '@/utils/api'
import { adminFetch, getAdminErrorMessage } from '@/utils/admin-auth'
import type { Config } from '@/types'

export default function AdminConfigPage() {
  const { ready, role } = useStaffAccess({ adminOnly: true })
  const [config, setConfig] = useState<Config | null>(null)
  const [edited, setEdited] = useState<Partial<Config>>({})
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!ready) return

    const loadConfig = async () => {
      setLoading(true)

      try {
        const response = await adminFetch(apiUrl('/api/admin/config'))
        const data = await response.json().catch(() => null)

        if (response.status === 401) {
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
          return
        }

        if (!response.ok) {
          setMessage(getAdminErrorMessage(response, data))
          setConfig(null)
          return
        }

        setConfig(data?.config || null)
        setEdited({})
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : 'Failed to load configuration',
        )
      } finally {
        setLoading(false)
      }
    }
    loadConfig()
  }, [pathname, ready, router])

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    try {
      const response = await adminFetch(apiUrl('/api/admin/config'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(edited),
      })

      const data = await response.json().catch(() => null)

      if (response.status === 401) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
        return
      }

      if (!response.ok) {
        setMessage(getAdminErrorMessage(response, data))
        return
      }

      setConfig(data?.config || null)
      setEdited({})
      setMessage('Configuration updated successfully')
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Error saving configuration',
      )
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof Config, value: unknown) => {
    setEdited({ ...edited, [field]: value })
  }

  if (!ready || !role) {
    return null
  }

  if (loading) {
    return (
      <main className='shell'>
        <section className='panel'>
          <div className='panel-inner'>
            <p className='muted'>Loading configuration...</p>
          </div>
        </section>
      </main>
    )
  }

  if (!config) {
    return (
      <main className='shell'>
        <section className='panel'>
          <div className='panel-inner'>
            <p className='muted'>Failed to load configuration</p>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className='shell'>
      <section className='panel' style={{ width: 'min(100%, 800px)' }}>
        <div className='panel-inner'>
          <div className='page-head'>
            <div>
              <span className='brand'>
                <span className='brand-mark' />
                BetterBlog
              </span>
              <h1 className='page-title'>System Configuration</h1>
              <p className='lede'>
                Manage application settings and system-wide configuration.
              </p>
            </div>
            <AdminNav role={role} />
          </div>

          {message ? (
            <div className='notice' style={{ marginTop: 16 }}>
              {message}
            </div>
          ) : null}

          <form onSubmit={handleSave} style={{ marginTop: 18 }}>
            <div className='card'>
              <h2 style={{ marginTop: 0 }}>Post Management</h2>

              <div className='field'>
                <label htmlFor='maxPostsPerUser'>Maximum posts per user</label>
                <input
                  id='maxPostsPerUser'
                  type='number'
                  min='1'
                  value={edited.maxPostsPerUser ?? config.maxPostsPerUser}
                  onChange={(e) =>
                    handleChange('maxPostsPerUser', parseInt(e.target.value))
                  }
                />
                <p
                  className='muted'
                  style={{ margin: '4px 0 0 0', fontSize: '0.85em' }}
                >
                  Leave unlimited by setting to a very high number (e.g.,
                  999999)
                </p>
              </div>
            </div>

            <div className='card'>
              <h2 style={{ marginTop: 0 }}>User Management</h2>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <input
                  type='checkbox'
                  checked={
                    edited.allowUserRegistration ?? config.allowUserRegistration
                  }
                  onChange={(e) =>
                    handleChange('allowUserRegistration', e.target.checked)
                  }
                />
                Allow user registration
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type='checkbox'
                  checked={
                    edited.requireEmailVerification ??
                    config.requireEmailVerification
                  }
                  onChange={(e) =>
                    handleChange('requireEmailVerification', e.target.checked)
                  }
                />
                Require email verification
              </label>
            </div>

            <div className='card'>
              <h2 style={{ marginTop: 0 }}>Sharing & API</h2>

              <div className='field'>
                <label htmlFor='maxSharingLinkExpiryDays'>
                  Max sharing link expiry (days)
                </label>
                <input
                  id='maxSharingLinkExpiryDays'
                  type='number'
                  min='1'
                  value={
                    edited.maxSharingLinkExpiryDays ??
                    config.maxSharingLinkExpiryDays
                  }
                  onChange={(e) =>
                    handleChange(
                      'maxSharingLinkExpiryDays',
                      parseInt(e.target.value),
                    )
                  }
                />
              </div>

              <div className='field'>
                <label htmlFor='defaultTokenExpiryDays'>
                  Default API token expiry (days)
                </label>
                <input
                  id='defaultTokenExpiryDays'
                  type='number'
                  min='1'
                  value={
                    edited.defaultTokenExpiryDays ??
                    config.defaultTokenExpiryDays
                  }
                  onChange={(e) =>
                    handleChange(
                      'defaultTokenExpiryDays',
                      parseInt(e.target.value),
                    )
                  }
                />
              </div>
            </div>

            <div className='actions'>
              <button
                className='button'
                type='submit'
                disabled={saving || Object.keys(edited).length === 0}
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
              <button
                className='button-secondary'
                type='button'
                onClick={() => {
                  setEdited({})
                  setMessage('')
                }}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}
