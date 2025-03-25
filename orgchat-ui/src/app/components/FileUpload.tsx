'use client'

import { useState } from 'react'
import { supabase } from '../util/supabase'

export default function FileUpload({ conversationId }: { conversationId: string }) {
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || file.size > 2 * 1024 * 1024) return alert('Max file size is 2MB.')

    setUploading(true)

    const filePath = `${conversationId}/${Date.now()}_${file.name}`

    const { data, error } = await supabase.storage
      .from('orgchat-docs')
      .upload(filePath, file)

    if (error) {
      console.error('Upload error:', error.message)
      alert('Upload failed')
      setUploading(false)
      return
    }

    await fetch('/api/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId,
        filePath,
        fileName: file.name,
      }),
    })

    setUploading(false)
    alert('Ingestion complete ✅')
  }

  return (
    <div className="mb-4">
      <label className="text-sm font-medium">Upload Document (PDF/CSV)</label>
      <input
        type="file"
        accept=".pdf,.csv"
        onChange={handleFileUpload}
        className="block mt-2"
        disabled={uploading}
      />
      {uploading && <p className="text-xs text-gray-500 mt-1">Uploading & processing…</p>}
    </div>
  )
}
