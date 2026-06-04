'use client'

import { useStaffAccess } from '@/hooks/use-staff-access'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { ready } = useStaffAccess()

  if (!ready) {
    return (
      <main className='shell'>
        <section className='panel'>
          <div className='panel-inner'>
            <p className='muted'>Checking access...</p>
          </div>
        </section>
      </main>
    )
  }

  return children
}
