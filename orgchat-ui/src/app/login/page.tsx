'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../util/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 bg-white shadow-md p-6 rounded-xl">
      <h1 className="text-2xl font-semibold mb-4">Login</h1>
      <form className="space-y-4" onSubmit={handleLogin}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email"
          className="w-full border p-2 rounded"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Password"
          className="w-full border p-2 rounded"
        />
        {error && <p className="text-red-500">{error}</p>}
        <button type="submit" className="w-full bg-black text-white py-2 rounded">
          Sign In
        </button>
      </form>
      <p className="mt-4 text-sm">
        Don’t have an account?{' '}
        <a href="/signup" className="text-blue-600 hover:underline">Sign up</a>
      </p>

    </div>
  )
}
