// src/app/signup/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../util/supabase'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 bg-white shadow-md p-6 rounded-xl">
      <h1 className="text-2xl font-semibold mb-4">Sign Up</h1>
      <form className="space-y-4" onSubmit={handleSignup}>
        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-500">{error}</p>}
        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded"
        >
          Create Account
        </button>
      </form>
      <p className="mt-4 text-sm">
        Already have an account?{' '}
        <a href="/login" className="text-blue-600 hover:underline">Log in</a>
      </p>
    </div>
  )
}
