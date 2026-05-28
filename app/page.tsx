'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [creators, setCreators] = useState<any[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    async function loadCreators() {
      const { data } = await supabase.from('creators').select('*')
      if (data) setCreators(data)
    }
    loadCreators()
  }, [])

  const filtered = creators.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.niche.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <main style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>Creator search</h1>

      <input
        type="text"
        placeholder="Search by name or niche..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ width: '100%', padding: 12, fontSize: 16, borderRadius: 8, border: '1px solid #ccc', marginBottom: 20 }}
      />

      {filtered.map((c) => (
        <div key={c.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 12 }}>
          <strong>{c.name}</strong>
          <p style={{ margin: '4px 0 0', color: '#666' }}>
            {c.niche} · {c.followers.toLocaleString()} followers · age {c.age}
          </p>
        </div>
      ))}
    </main>
  )
}