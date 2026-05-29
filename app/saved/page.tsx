'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Saved() {
  const [saved, setSaved] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    loadSaved()
  }, [])

  async function loadSaved() {
    const { data } = await supabase
      .from('saved_creators')
      .select('id, status, notes, last_contacted, creators(*)')
    if (data) setSaved(data.filter((s: any) => s.creators))
    setLoading(false)
  }

  async function unsave(savedId: number) {
    await supabase.from('saved_creators').delete().eq('id', savedId)
    setSaved(saved.filter((s) => s.id !== savedId))
  }

  async function updateStatus(savedId: number, newStatus: string) {
    const update: any = { status: newStatus }
    if (newStatus === 'contacted') update.last_contacted = new Date().toISOString()
    await supabase.from('saved_creators').update(update).eq('id', savedId)
    setSaved(saved.map((s) => (s.id === savedId ? { ...s, ...update } : s)))
  }

  async function updateNotes(savedId: number, newNotes: string) {
    await supabase.from('saved_creators').update({ notes: newNotes }).eq('id', savedId)
    setSaved(saved.map((s) => (s.id === savedId ? { ...s, notes: newNotes } : s)))
  }

  function formatDate(iso: string | null) {
    if (!iso) return null
    const d = new Date(iso)
    const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return 'today'
    if (days === 1) return 'yesterday'
    if (days < 7) return `${days} days ago`
    return d.toLocaleDateString()
  }

  const nicheColors: Record<string, string> = { fitness: '#e8f5e9', beauty: '#fce4ec', tech: '#e3f2fd', fashion: '#f3e5f5', food: '#fff3e0', travel: '#e0f7fa' }
  const nicheText: Record<string, string> = { fitness: '#2e7d32', beauty: '#c2185b', tech: '#1565c0', fashion: '#6a1b9a', food: '#e65100', travel: '#00838f' }
  const nicheEmoji: Record<string, string> = { fitness: '💪', beauty: '💄', tech: '💻', fashion: '👗', food: '🍳', travel: '✈️' }

  const statusOptions = [
    { value: 'to_contact', label: 'To contact', bg: '#f5f5f5', color: '#555' },
    { value: 'contacted', label: 'Contacted', bg: '#fff8e1', color: '#a66a00' },
    { value: 'sample_sent', label: 'Sample sent', bg: '#e3f2fd', color: '#1565c0' },
    { value: 'posted', label: 'Posted', bg: '#f3e5f5', color: '#6a1b9a' },
    { value: 'converted', label: 'Converted', bg: '#e8f5e9', color: '#2e7d32' },
  ]

  const filtered = saved.filter((s) => {
    if (!query) return true
    const q = query.toLowerCase()
    return s.creators.name.toLowerCase().includes(q) || s.creators.niche.toLowerCase().includes(q) || (s.notes && s.notes.toLowerCase().includes(q))
  })

  return (
    <main style={{ minHeight: '100vh', background: '#fafafa', fontFamily: 'system-ui, sans-serif', padding: '48px 16px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#111', letterSpacing: -0.5 }}>
            Creators<span style={{ color: '#7c3aed' }}>+</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 4, color: '#111' }}>My saved</h1>
            <p style={{ color: '#777', margin: 0, fontSize: 15 }}>Your creator pipeline</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="/dashboard" style={{ fontSize: 14, color: '#111', textDecoration: 'none', padding: '8px 14px', border: '1px solid #ddd', borderRadius: 10 }}>Dashboard</a>
            <a href="/" style={{ fontSize: 14, color: '#111', textDecoration: 'none', padding: '8px 14px', border: '1px solid #ddd', borderRadius: 10 }}>Back to search</a>
          </div>
        </div>

        {saved.length > 0 && (
          <input type="text" placeholder="Search your saved creators..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: '100%', padding: 12, fontSize: 15, borderRadius: 10, border: '1px solid #e0e0e0', marginBottom: 16, boxSizing: 'border-box', outline: 'none' }} />
        )}

        {loading ? (
          <p style={{ color: '#999', fontSize: 14 }}>Loading...</p>
        ) : saved.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 14, padding: 60, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>★</div>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: '#111' }}>No saved creators yet</h2>
            <p style={{ color: '#777', fontSize: 14, marginBottom: 24 }}>Find creators you'd like to work with and save them here.</p>
            <a href="/" style={{ display: 'inline-block', fontSize: 14, color: '#fff', textDecoration: 'none', padding: '12px 20px', background: '#111', borderRadius: 10 }}>Browse creators</a>
          </div>
        ) : (
          <>
            <p style={{ color: '#999', fontSize: 14, marginBottom: 16 }}>{filtered.length} of {saved.length} {saved.length === 1 ? 'creator' : 'creators'}</p>
            {filtered.map((s) => {
              const c = s.creators
              const statusInfo = statusOptions.find((opt) => opt.value === s.status) || statusOptions[0]
              const isHover = hoveredId === s.id
              const lastContactedStr = formatDate(s.last_contacted)
              return (
                <div key={s.id} onMouseEnter={() => setHoveredId(s.id)} onMouseLeave={() => setHoveredId(null)} style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 12, boxShadow: isHover ? '0 6px 16px rgba(0,0,0,0.10)' : '0 1px 3px rgba(0,0,0,0.06)', transform: isHover ? 'translateY(-2px)' : 'translateY(0)', transition: 'all 0.2s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 600, color: '#888', flexShrink: 0 }}>{c.name.charAt(0).toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <strong style={{ fontSize: 16, color: '#111' }}>{c.name}</strong>
                        <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 20, background: nicheColors[c.niche] || '#eee', color: nicheText[c.niche] || '#555', fontWeight: 500 }}>{nicheEmoji[c.niche] || ''} {c.niche}</span>
                      </div>
                      <p style={{ margin: 0, color: '#777', fontSize: 14 }}>{c.followers.toLocaleString()} followers · age {c.age}</p>
                    </div>
                    <button onClick={() => unsave(s.id)} style={{ padding: '8px 14px', fontSize: 13, borderRadius: 10, border: '1px solid #ddd', background: '#fff', color: '#111', cursor: 'pointer' }}>Remove</button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 12, paddingBottom: 12, borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
                    <span style={{ fontSize: 13, color: '#777' }}>Status:</span>
                    <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: statusInfo.bg, color: statusInfo.color, fontWeight: 500 }}>{statusInfo.label}</span>
                    {lastContactedStr && <span style={{ fontSize: 12, color: '#999' }}>· last contacted {lastContactedStr}</span>}
                    <select value={s.status || 'to_contact'} onChange={(e) => updateStatus(s.id, e.target.value)} style={{ marginLeft: 'auto', padding: '6px 10px', fontSize: 13, borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer' }}>
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ paddingTop: 12 }}>
                    <label style={{ fontSize: 13, color: '#777', display: 'block', marginBottom: 6 }}>Notes</label>
                    <textarea
                      value={s.notes || ''}
                      onChange={(e) => updateNotes(s.id, e.target.value)}
                      placeholder="Add notes about this creator..."
                      style={{ width: '100%', padding: 10, fontSize: 14, borderRadius: 8, border: '1px solid #e0e0e0', boxSizing: 'border-box', resize: 'vertical', minHeight: 50, fontFamily: 'inherit', outline: 'none' }}
                    />
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </main>
  )
}