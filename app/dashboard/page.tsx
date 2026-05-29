'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Dashboard() {
  const [saved, setSaved] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase
        .from('saved_creators')
        .select('status, creators(*)')
      if (data) setSaved(data.filter((s: any) => s.creators))
      setLoading(false)
    }
    loadData()
  }, [])

  const statusOptions = [
    { value: 'to_contact', label: 'To contact', color: '#999' },
    { value: 'contacted', label: 'Contacted', color: '#f5a623' },
    { value: 'sample_sent', label: 'Sample sent', color: '#1565c0' },
    { value: 'posted', label: 'Posted', color: '#6a1b9a' },
    { value: 'converted', label: 'Converted', color: '#2e7d32' },
  ]

  const counts = statusOptions.map((opt) => ({
    ...opt,
    count: saved.filter((s) => (s.status || 'to_contact') === opt.value).length,
  }))

  const total = saved.length
  const converted = counts.find((c) => c.value === 'converted')?.count || 0
  const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0
  const totalReach = saved.reduce((sum, s) => sum + (s.creators?.followers || 0), 0)

  const nicheCounts: Record<string, number> = {}
  saved.forEach((s) => {
    const niche = s.creators?.niche
    if (niche) nicheCounts[niche] = (nicheCounts[niche] || 0) + 1
  })
  const topNiches = Object.entries(nicheCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const nicheColors: Record<string, string> = { fitness: '#e8f5e9', beauty: '#fce4ec', tech: '#e3f2fd', fashion: '#f3e5f5', food: '#fff3e0', travel: '#e0f7fa' }
  const nicheText: Record<string, string> = { fitness: '#2e7d32', beauty: '#c2185b', tech: '#1565c0', fashion: '#6a1b9a', food: '#e65100', travel: '#00838f' }
  const nicheEmoji: Record<string, string> = { fitness: '💪', beauty: '💄', tech: '💻', fashion: '👗', food: '🍳', travel: '✈️' }

  return (
    <main style={{ minHeight: '100vh', background: '#fafafa', fontFamily: 'system-ui, sans-serif', padding: '48px 16px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#111', letterSpacing: -0.5 }}>
            Creators<span style={{ color: '#7c3aed' }}>+</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 4, color: '#111' }}>Dashboard</h1>
            <p style={{ color: '#777', margin: 0, fontSize: 15 }}>Your creator program at a glance</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="/" style={{ fontSize: 14, color: '#111', textDecoration: 'none', padding: '8px 14px', border: '1px solid #ddd', borderRadius: 10 }}>Search</a>
            <a href="/saved" style={{ fontSize: 14, color: '#111', textDecoration: 'none', padding: '8px 14px', border: '1px solid #ddd', borderRadius: 10 }}>My saved</a>
          </div>
        </div>

        {loading ? (
          <p style={{ color: '#999', fontSize: 14 }}>Loading...</p>
        ) : total === 0 ? (
          <div style={{ background: '#fff', borderRadius: 14, padding: 60, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: '#111' }}>No data yet</h2>
            <p style={{ color: '#777', fontSize: 14, marginBottom: 24 }}>Save some creators to see your dashboard come to life.</p>
            <a href="/" style={{ display: 'inline-block', fontSize: 14, color: '#fff', textDecoration: 'none', padding: '12px 20px', background: '#111', borderRadius: 10 }}>Browse creators</a>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
              <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <p style={{ margin: 0, fontSize: 13, color: '#999', marginBottom: 6 }}>Total saved</p>
                <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#111' }}>{total}</p>
              </div>
              <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <p style={{ margin: 0, fontSize: 13, color: '#999', marginBottom: 6 }}>Conversion rate</p>
                <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#2e7d32' }}>{conversionRate}%</p>
              </div>
              <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <p style={{ margin: 0, fontSize: 13, color: '#999', marginBottom: 6 }}>Total reach</p>
                <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#111' }}>{totalReach.toLocaleString()}</p>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 14, padding: 24, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, marginTop: 0, marginBottom: 18, color: '#111' }}>Pipeline</h2>
              {counts.map((c) => {
                const pct = total > 0 ? (c.count / total) * 100 : 0
                return (
                  <div key={c.value} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                      <span style={{ color: '#333' }}>{c.label}</span>
                      <span style={{ color: '#777' }}>{c.count}</span>
                    </div>
                    <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: c.color, transition: 'width 0.3s' }}></div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, marginTop: 0, marginBottom: 18, color: '#111' }}>Top niches</h2>
              {topNiches.map(([niche, count]) => (
                <div key={niche} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <span style={{ fontSize: 13, padding: '4px 12px', borderRadius: 20, background: nicheColors[niche] || '#eee', color: nicheText[niche] || '#555', fontWeight: 500 }}>{nicheEmoji[niche] || ''} {niche}</span>
                  <span style={{ fontSize: 14, color: '#777' }}>{count} {count === 1 ? 'creator' : 'creators'}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}