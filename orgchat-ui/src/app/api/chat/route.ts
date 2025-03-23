import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import OpenAI from 'openai'
import { error } from 'console'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  const { conversationId, userMessage } = await req.json()

  if (!conversationId || !userMessage) {
    return NextResponse.json({ success: false, error: 'Missing data' }, { status: 400 })
  }

  const token = req.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ success: false, error: 'Missing access token' }, { status: 401 })
  }

  // Use Supabase SSR client with access token
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: () => undefined,
        set: () => {},
        remove: () => {},
      },
    }
  )

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: error}, { status: 401 })
  }
    // -- rest of your logic unchanged --
    // insert user message, fetch all messages, call OpenAI, save assistant reply

    // 1. Insert user message
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: 'user',
      content: userMessage,
    })

    // 2. Fetch full context
    const { data: conversationMessages } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (!conversationMessages) {
      return NextResponse.json({ success: false, error: 'Failed to fetch conversation messages' }, { status: 500 })
    }

    const openAiMessages = conversationMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    const aiRes = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: openAiMessages,
    })

    const assistantReply = aiRes.choices[0].message?.content || 'No reply'

    const { data: insertedAssistant } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        role: 'assistant',
        content: assistantReply,
      })
      .select()
      .single()

    return NextResponse.json({
      success: true,
      assistantMessage: insertedAssistant,
    })
    } catch (err) {
      if (err instanceof Error) {
        console.error('[ERROR]', err.message)
      } else {
        console.error('[ERROR]', err)
      }
      return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
