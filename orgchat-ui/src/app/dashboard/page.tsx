// src/app/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../util/supabase'

export default function DashboardHome() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        router.replace('/login')
      } else {
        setUserEmail(data.user.email ?? null)
      }
    })
  }, [router])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Welcome {userEmail} 👋</h1>
      <p>This is your AI-powered dashboard.</p>

      <button
        onClick={async () => {
          await supabase.auth.signOut()
          router.push('/login')
        }}
        className="text-sm text-red-600 hover:underline mt-4"
      >
        Logout
      </button>
    </div>
  )
}
