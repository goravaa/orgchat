'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../util/supabase'
import FileUpload from '../../components/FileUpload'
export default function ChatPage() {
  const router = useRouter()
  const { conversationId } = useParams() as { conversationId: string }

  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  // 1. Load conversation + messages
  useEffect(() => {
    const loadData = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
      if (error) {
        console.error(error)
      } else {
        setMessages(data)
      }
    }
    loadData()
  }, [conversationId])

  // 2. Send user message -> call /api/chat
  const sendMessage = async () => {
    if (!input.trim()) return
    setLoading(true)
  
    const { data: sessionData } = await supabase.auth.getSession()
    const access_token = sessionData.session?.access_token
  
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(access_token && { Authorization: `Bearer ${access_token}` }),
      },
      body: JSON.stringify({
        conversationId,
        userMessage: input,
      }),
    })
  
    const data = await res.json()
    if (!data.success) {
      console.error(data.error)
    } else {
      // Append assistant’s message
      setMessages((prev) => [...prev, data.assistantMessage])
    }
    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 space-y-6">
      {/* MESSAGES */}
      <div className="space-y-3">
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`p-3 rounded ${
              msg.role === 'user' ? 'bg-gray-200' : 'bg-green-100'
            }`}
          >
            <span className="block font-semibold">{msg.role}</span>
            <span>{msg.content}</span>
          </div>
        ))}
      </div>
      <FileUpload conversationId={conversationId} />
      {/* INPUT BOX */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          sendMessage()
        }}
        className="flex gap-2"
      >
        <input
          className="flex-1 border rounded p-2"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded"
          disabled={loading}
        >
          Send
        </button>
      </form>
    </div>
  )
}
