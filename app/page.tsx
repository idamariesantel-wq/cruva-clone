'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [creators, setCreators] = useState<any[]>([])
  const [query, setQuery] = useState('')
  const [niche, setNiche] = useState('all')
  const [minFollowers, setMinFollowers] = useState(0)

useEffect(() => {
    async function loadCreators() {
      const { data, error } = await supabase.from('creators').select('*')
      console.log('DATA:', data)
      console.log('ERROR:', error)
      if (data) setCreators(data)
    }
    loadCreators()
  }, [])

  const filtered = creators.filter((c) => {
    const matchesText =
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.niche.toLowerCase().includes(query.toLowerCase())
    const matchesNiche = niche === 'all' || c.niche === niche
    const matchesFollowers = c.followers >= minFollowers
    return matchesText && matchesNiche && matchesFollowers
  })

  const nicheColors: Record<string, string> = {
    fitness: '#e8f5e9',
    beauty: '#fce4ec',
    tech: '#e3f2fd',
  }
  const nicheText: Record<string, string> = {
    fitness: '#2e7d32',
    beauty: '#c2185b',
    tech: '#1565c0',
  }

  return (
    <main style={{ minHeight: '100vh', background: '#fafafa', fontFamily: 'system-ui, sans-serif', padding: '48px 16px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 4, color: '#111' }}>Creator search</h1>
        <p style={{ color: '#777', marginBottom: 28, fontSize: 15 }}>Find creators for your brand</p>

        <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 24 }}>
          <input
            type="text"
            placeholder="Search by name or niche..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: '100%', padding: 12, fontSize: 16, borderRadius: 10, border: '1px solid #e0e0e0', marginBottom: 16, boxSizing: 'border-box', outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              style={{ padding: 10, fontSize: 15, borderRadius: 10, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer' }}
            >
              <option value="all">All niches</option>
              <option value="fitness">Fitness</option>
              <option value="beauty">Beauty</option>
              <option value="tech">Tech</option>
            </select>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 4 }}>
                Min followers: {minFollowers.toLocaleString()}
              </label>
              <input
                type="range"
                min={0}
                max={120000}
                step={1000}
                value={minFollowers}
                onChange={(e) => setMinFollowers(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>

        <p style={{ color: '#999', fontSize: 14, marginBottom: 16 }}>
          {filtered.length} {filtered.length === 1 ? 'creator' : 'creators'} found
        </p>

        {filtered.map((c) => (
          <div key={c.id} style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 600, color: '#888', flexShrink: 0 }}>
              {c.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <strong style={{ fontSize: 16, color: '#111' }}>{c.name}</strong>
                <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 20, background: nicheColors[c.niche] || '#eee', color: nicheText[c.niche] || '#555', fontWeight: 500 }}>
                  {c.niche}
                </span>
              </div>
              <p style={{ margin: 0, color: '#777', fontSize: 14 }}>
                {c.followers.toLocaleString()} followers · age {c.age}
              </p>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}