// src/app/layout.tsx
import './globals.css'
import { ReactNode } from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'OrgChat',
  description: 'Self-hosted AI assistant for your org',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {/* You can add <Header /> here later */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </main>
        {/* <Footer /> or toaster can go here */}
      </body>
    </html>
  )
}
