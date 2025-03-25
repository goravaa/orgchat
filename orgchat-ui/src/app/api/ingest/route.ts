import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import pdfParse from 'pdf-parse'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  const { filePath, conversationId, fileName } = await req.json()

  const { data: fileUrlData } = supabase.storage
    .from('orgchat-docs')
    .getPublicUrl(filePath)

  const res = await fetch(fileUrlData.publicUrl)
  const buffer = await res.arrayBuffer()
  const fileBuffer = Buffer.from(buffer)

  let text = ''

  if (fileName.endsWith('.pdf')) {
    const parsed = await pdfParse(fileBuffer)
    text = parsed.text
  } else if (fileName.endsWith('.csv')) {
    text = fileBuffer.toString('utf-8')
  } else {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
  }

  const { data: userRes } = await supabase
    .from('conversations')
    .select('user_id')
    .eq('id', conversationId)
    .single()

  const { data: docRes } = await supabase
    .from('documents')
    .insert({
      user_id: userRes?.user_id,
      conversation_id: conversationId,
      name: fileName,
      file_path: filePath,
    })
    .select()
    .single()

  const chunks = splitIntoChunks(text)

  for (const chunk of chunks) {
    const embedRes = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: chunk,
    })

    await supabase.from('document_chunks').insert({
      document_id: docRes.id,
      content: chunk,
      embedding: embedRes.data[0].embedding,
    })
  }

  return NextResponse.json({ success: true })
}

function splitIntoChunks(text: string, maxLen = 500): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/)
  const chunks: string[] = []
  let current = ''

  for (const sentence of sentences) {
    if ((current + sentence).length > maxLen) {
      chunks.push(current)
      current = ''
    }
    current += sentence + ' '
  }
  if (current) chunks.push(current)
  return chunks
}
