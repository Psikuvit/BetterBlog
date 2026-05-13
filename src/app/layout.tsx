import type { Metadata } from 'next'
import './globals.css'

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
      <body>{children}</body>
    </html>
  )
}