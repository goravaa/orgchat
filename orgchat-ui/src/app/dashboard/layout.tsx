// src/app/dashboard/layout.tsx
'use client'

import { ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '../util/supabase'

interface Conversation {
  id: string
  title: string
  is_pinned: boolean
  updated_at: string
  model?: string
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [conversations, setConversations] = useState<Conversation[]>([])

  useEffect(() => {
    const fetchConversations = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false })

      if (data) setConversations(data as Conversation[])
      else console.error('Failed to load conversations', error)
    }

    fetchConversations()
  }, [])

  const createNewChat = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const model = prompt('Choose model: gpt-3.5-turbo or gpt-4', 'gpt-3.5-turbo') || 'gpt-3.5-turbo'

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title: 'Untitled Chat',
        model,
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

  const renameChat = async (id: string) => {
    const title = prompt('Enter new title:')
    if (!title) return
    await supabase.from('conversations').update({ title }).eq('id', id)
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)))
  }

  const deleteChat = async (id: string) => {
    if (!confirm('Are you sure you want to delete this chat?')) return
    await supabase.from('conversations').delete().eq('id', id)
    setConversations((prev) => prev.filter((c) => c.id !== id))
    if (pathname.includes(id)) router.push('/dashboard')
  }

  const togglePinChat = async (id: string, current: boolean) => {
    await supabase.from('conversations').update({ is_pinned: !current }).eq('id', id)
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_pinned: !current } : c))
    )
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-72 bg-black text-white p-4 space-y-4 flex flex-col justify-between overflow-y-auto">
        <div>
          <h2 className="text-2xl font-bold mb-4">OrgChat</h2>
          <nav className="flex flex-col space-y-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group p-2 rounded transition ${
                  pathname.includes(conv.id) ? 'bg-gray-700' : 'hover:bg-gray-800'
                }`}
              >
                <div
                  onClick={() => router.push(`/chat/${conv.id}`)}
                  className="cursor-pointer flex justify-between items-center"
                >
                  <span className="truncate max-w-[140px]">
                    {conv.title || 'Untitled Chat'}
                  </span>
                  {conv.is_pinned && <span title="Pinned">📌</span>}
                </div>
                <div className="flex space-x-2 text-xs mt-1 opacity-0 group-hover:opacity-100">
                  <button onClick={() => renameChat(conv.id)}>✏️</button>
                  <button onClick={() => deleteChat(conv.id)}>🗑️</button>
                  <button onClick={() => togglePinChat(conv.id, conv.is_pinned)}>
                    {conv.is_pinned ? 'Unpin' : '📌'}
                  </button>
                </div>
              </div>
            ))}
          </nav>
        </div>

        <button
          onClick={createNewChat}
          className="w-full bg-white text-black py-2 rounded hover:bg-gray-200 transition"
        >
          + New Chat
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
