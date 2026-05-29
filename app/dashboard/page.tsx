'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Dashboard() {
  const [saved, setSaved] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const savedTheme = (typeof window !== 'undefined' ? localStorage.getItem('theme') : null) as 'light' | 'dark' | null
    const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    const initial = savedTheme || (prefersDark ? 'dark' : 'light')
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial)

    async function loadData() {
      const { data } = await supabase
        .from('saved_creators')
        .select('status, creators(*)')
      if (data) setSaved(data.filter((s: any) => s.creators))
      setLoading(false)
    }
    loadData()
  }, [])

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
  }

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

  const nicheStats: Record<string, { count: number; reach: number }> = {}
  saved.forEach((s) => {
    const niche = s.creators?.niche
    const followers = s.creators?.followers || 0
    if (niche) {
      if (!nicheStats[niche]) nicheStats[niche] = { count: 0, reach: 0 }
      nicheStats[niche].count += 1
      nicheStats[niche].reach += followers
    }
  })
  const topNiches = Object.entries(nicheStats).sort((a, b) => b[1].count - a[1].count).slice(0, 5)

  const nicheColors: Record<string, string> = { fitness: '#e8f5e9', beauty: '#fce4ec', tech: '#e3f2fd', fashion: '#f3e5f5', food: '#fff3e0', travel: '#e0f7fa' }
  const nicheText: Record<string, string> = { fitness: '#2e7d32', beauty: '#c2185b', tech: '#1565c0', fashion: '#6a1b9a', food: '#e65100', travel: '#00838f' }
  const nicheEmoji: Record<string, string> = { fitness: '💪', beauty: '💄', tech: '💻', fashion: '👗', food: '🍳', travel: '✈️' }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui, sans-serif', padding: '32px 16px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.5 }}>
            Creators<span style={{ color: 'var(--accent)' }}>+</span>
          </div>
          <button onClick={toggleTheme} title="Toggle theme" style={{ background: 'var(--button-secondary-bg)', border: '1px solid var(--button-secondary-border)', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontSize: 16, color: 'var(--text)' }}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 auto', minWidth: 0 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4, color: 'var(--text)', margin: 0 }}>Dashboard</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, marginTop: 4, fontSize: 14 }}>Your creator program at a glance</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a href="/" style={{ fontSize: 13, color: 'var(--text)', textDecoration: 'none', padding: '8px 12px', border: '1px solid var(--button-secondary-border)', borderRadius: 10, whiteSpace: 'nowrap', background: 'var(--button-secondary-bg)' }}>Search</a>
            <a href="/saved" style={{ fontSize: 13, color: 'var(--text)', textDecoration: 'none', padding: '8px 12px', border: '1px solid var(--button-secondary-border)', borderRadius: 10, whiteSpace: 'nowrap', background: 'var(--button-secondary-bg)' }}>My saved</a>
            <a href="/settings" style={{ fontSize: 13, color: 'var(--text)', textDecoration: 'none', padding: '8px 12px', border: '1px solid var(--button-secondary-border)', borderRadius: 10, whiteSpace: 'nowrap', background: 'var(--button-secondary-bg)' }}>Settings</a>
          </div>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-faint)', fontSize: 14 }}>Loading...</p>
        ) : total === 0 ? (
          <div style={{ background: 'var(--card-bg)', borderRadius: 14, padding: 48, textAlign: 'center', boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>📊</div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>No data yet</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>Save some creators to see your dashboard come to life.</p>
            <a href="/" style={{ display: 'inline-block', fontSize: 14, color: 'var(--button-text)', textDecoration: 'none', padding: '12px 20px', background: 'var(--button-bg)', borderRadius: 10 }}>Browse creators</a>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 20 }}>
              <div style={{ background: 'var(--card-bg)', borderRadius: 14, padding: 16, boxShadow: 'var(--shadow)' }}>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-faint)', marginBottom: 6 }}>Total saved</p>
                <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: 'var(--text)' }}>{total}</p>
              </div>
              <div style={{ background: 'var(--card-bg)', borderRadius: 14, padding: 16, boxShadow: 'var(--shadow)' }}>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-faint)', marginBottom: 6 }}>Conversion rate</p>
                <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#2e7d32' }}>{conversionRate}%</p>
              </div>
              <div style={{ background: 'var(--card-bg)', borderRadius: 14, padding: 16, boxShadow: 'var(--shadow)' }}>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-faint)', marginBottom: 6 }}>Total reach</p>
                <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: 'var(--text)' }}>{totalReach.toLocaleString()}</p>
              </div>
            </div>

            <div style={{ background: 'var(--card-bg)', borderRadius: 14, padding: 20, marginBottom: 20, boxShadow: 'var(--shadow)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 16, color: 'var(--text)' }}>Pipeline</h2>
              {counts.map((c) => {
                const pct = total > 0 ? (c.count / total) * 100 : 0
                return (
                  <div key={c.value} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                      <span style={{ color: 'var(--text)' }}>{c.label}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{c.count}</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--skeleton-bg)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: c.color, transition: 'width 0.3s' }}></div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ background: 'var(--card-bg)', borderRadius: 14, padding: 20, boxShadow: 'var(--shadow)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 16, color: 'var(--text)' }}>Top niches</h2>
              {topNiches.map(([niche, stats]) => (
                <div key={niche} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-light)', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, padding: '4px 12px', borderRadius: 20, background: nicheColors[niche] || '#eee', color: nicheText[niche] || '#555', fontWeight: 500 }}>{nicheEmoji[niche] || ''} {niche}</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{stats.count} {stats.count === 1 ? 'creator' : 'creators'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{stats.reach.toLocaleString()} total reach</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}