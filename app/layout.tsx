import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Loading Test - Batch link rendering performance tester',
  description: 'Test image/HTML load and render performance in bulk with live stats.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

