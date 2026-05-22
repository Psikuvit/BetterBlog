import type { Metadata } from 'next'
import './globals.css'
import { AuthGate } from '@/components/auth-gate'

export const metadata: Metadata = {
  title: 'BetterBlog',
  description: 'A simple blog app for testing auth, profiles, and posts.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  )
}