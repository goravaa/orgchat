//dashboard/layout.tsx
'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../util/supabase'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter()

  const createNewChat = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title: 'Untitled Chat',
      })
      .select()
      .single()

    if (data) {
      router.push(`/chat/${data.id}`)
    } else {
      alert('Error creating conversation')
      console.error(error)
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-black text-white p-6 space-y-4 flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-6">OrgChat</h2>
          <nav className="flex flex-col space-y-2">
            <Link href="/dashboard" className="hover:underline">Dashboard Home</Link>
            <Link href="/dashboard/settings" className="hover:underline">Settings</Link>
          </nav>
        </div>

        {/* New Chat Button */}
        <button
          onClick={createNewChat}
          className="w-full bg-white text-black py-2 rounded hover:bg-gray-200 transition"
        >
          + New Chat
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  )
}
