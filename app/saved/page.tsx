'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Saved() {
  const [creators, setCreators] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSaved() {
      const { data } = await supabase
        .from('saved_creators')
        .select('creators(*)')
      if (data) setCreators(data.map((s: any) => s.creators).filter(Boolean))
      setLoading(false)
    }
    loadSaved()
  }, [])

  async function unsave(creatorId: number) {
    await supabase.from('saved_creators').delete().eq('creator_id', creatorId)
    setCreators(creators.filter((c) => c.id !== creatorId))
  }

  const nicheColors: Record<string, string> = { fitness: '#e8f5e9', beauty: '#fce4ec', tech: '#e3f2fd', fashion: '#f3e5f5', food: '#fff3e0', travel: '#e0f7fa' }
  const nicheText: Record<string, string> = { fitness: '#2e7d32', beauty: '#c2185b', tech: '#1565c0', fashion: '#6a1b9a', food: '#e65100', travel: '#00838f' }

  return (
    <main style={{ minHeight: '100vh', background: '#fafafa', fontFamily: 'system-ui, sans-serif', padding: '48px 16px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 4, color: '#111' }}>My saved</h1>
            <p style={{ color: '#777', margin: 0, fontSize: 15 }}>Creators you've saved</p>
          </div>
          <a href="/" style={{ fontSize: 14, color: '#111', textDecoration: 'none', padding: '8px 14px', border: '1px solid #ddd', borderRadius: 10 }}>Back to search</a>
        </div>

        {loading ? (
          <p style={{ color: '#999', fontSize: 14 }}>Loading...</p>
        ) : creators.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 14, padding: 60, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>★</div>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: '#111' }}>No saved creators yet</h2>
            <p style={{ color: '#777', fontSize: 14, marginBottom: 24 }}>Find creators you'd like to work with and save them here.</p>
            <a href="/" style={{ display: 'inline-block', fontSize: 14, color: '#fff', textDecoration: 'none', padding: '12px 20px', background: '#111', borderRadius: 10 }}>Browse creators</a>
          </div>
        ) : (
          <>
            <p style={{ color: '#999', fontSize: 14, marginBottom: 16 }}>{creators.length} {creators.length === 1 ? 'creator' : 'creators'}</p>
            {creators.map((c) => (
              <div key={c.id} style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 600, color: '#888', flexShrink: 0 }}>{c.name.charAt(0).toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <strong style={{ fontSize: 16, color: '#111' }}>{c.name}</strong>
                    <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 20, background: nicheColors[c.niche] || '#eee', color: nicheText[c.niche] || '#555', fontWeight: 500 }}>{c.niche}</span>
                  </div>
                  <p style={{ margin: 0, color: '#777', fontSize: 14 }}>{c.followers.toLocaleString()} followers · age {c.age}</p>
                </div>
                <button onClick={() => unsave(c.id)} style={{ padding: '8px 14px', fontSize: 13, borderRadius: 10, border: '1px solid #ddd', background: '#fff', color: '#111', cursor: 'pointer' }}>Remove</button>
              </div>
            ))}
          </>
        )}
      </div>
    </main>
  )
}