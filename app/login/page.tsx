'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  async function signUp() {
    const { error } = await supabase.auth.signUp({ email, password })
    setMessage(error ? error.message : 'Account created! You can now log in.')
  }

  async function logIn() {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setMessage(error ? error.message : 'Logged in! Go to the home page.')
  }

  return (
    <main style={{ minHeight: '100vh', background: '#fafafa', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', width: '100%', maxWidth: 360 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20, color: '#111' }}>Log in</h1>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: 12, fontSize: 15, borderRadius: 10, border: '1px solid #e0e0e0', marginBottom: 12, boxSizing: 'border-box' }} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: 12, fontSize: 15, borderRadius: 10, border: '1px solid #e0e0e0', marginBottom: 16, boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={logIn} style={{ flex: 1, padding: 12, fontSize: 15, borderRadius: 10, border: 'none', background: '#111', color: '#fff', cursor: 'pointer' }}>Log in</button>
          <button onClick={signUp} style={{ flex: 1, padding: 12, fontSize: 15, borderRadius: 10, border: '1px solid #ccc', background: '#fff', color: '#111', cursor: 'pointer' }}>Sign up</button>
        </div>
        {message && <p style={{ marginTop: 16, fontSize: 14, color: '#555' }}>{message}</p>}
      </div>
    </main>
  )
}
