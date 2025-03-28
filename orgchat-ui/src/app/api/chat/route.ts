// src/app/api/chat/route.ts
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MAX_CONTEXT_TOKENS = 2000
const PINNED_CONTEXT_LIMIT = 1000
const CHUNK_CONTEXT_LIMIT = 3

export async function POST(req: Request) {
  const { conversationId, userMessage } = await req.json()

  if (!conversationId || !userMessage) {
    return NextResponse.json({ success: false, error: 'Missing data' }, { status: 400 })
  }

  const token = req.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ success: false, error: 'Missing access token' }, { status: 401 })
  }

  try {
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (!user || userError) {
      return NextResponse.json({ success: false, error: 'Invalid user' }, { status: 401 })
    }

    // Fetch model and pin status from conversation
    const { data: convo } = await supabaseAdmin
      .from('conversations')
      .select('model, is_pinned')
      .eq('id', conversationId)
      .single()

    const model = convo?.model || 'gpt-3.5-turbo'
    const isPinned = convo?.is_pinned || false

    // Insert user message
    await supabaseAdmin.from('messages').insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: 'user',
      content: userMessage,
    })

    // Embed user message for semantic search
    const embeddingRes = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: userMessage,
    })

    const userEmbedding = embeddingRes.data[0].embedding

    // Fetch top relevant chunks via pgvector similarity search
    const { data: chunks } = await supabaseAdmin.rpc('match_document_chunks', {
      query_embedding: userEmbedding,
      match_threshold: 0.78,
      match_count: CHUNK_CONTEXT_LIMIT,
    })

    const vectorContext = chunks?.map((chunk: any) => chunk.content).join('\n---\n') || ''

    // Fetch full message context
    const { data: conversationMessages } = await supabaseAdmin
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (!conversationMessages) {
      return NextResponse.json({ success: false, error: 'Failed to fetch conversation messages' }, { status: 500 })
    }

    let openAiMessages = []
    let tokenCount = 0

    // Prepend vector chunks as system message if found
    if (vectorContext) {
      openAiMessages.push({
        role: 'system',
        content: `You can refer to the following document context when answering the user:\n\n${vectorContext}`,
      })
    }

    // If pinned, intelligently trim earlier messages for context
    for (let i = conversationMessages.length - 1; i >= 0; i--) {
      const msg = conversationMessages[i]
      const tokens = Math.ceil(msg.content.length / 4)
      if (tokenCount + tokens > (isPinned ? PINNED_CONTEXT_LIMIT : MAX_CONTEXT_TOKENS)) break
      openAiMessages.unshift({ role: msg.role, content: msg.content })
      tokenCount += tokens
    }

    const aiRes = await openai.chat.completions.create({
      model,
      messages: openAiMessages,
    })

    const assistantReply = aiRes.choices[0].message?.content || 'No reply'

    const { data: insertedAssistant } = await supabaseAdmin
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
