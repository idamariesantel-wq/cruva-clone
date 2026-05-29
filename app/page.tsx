'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [creators, setCreators] = useState<any[]>([])
  const [availableNiches, setAvailableNiches] = useState<string[]>([])
  const [savedIds, setSavedIds] = useState<number[]>([])
  const [query, setQuery] = useState('')
  const [niche, setNiche] = useState('all')
  const [minFollowers, setMinFollowers] = useState(0)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [showLogin, setShowLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserEmail(user.email ?? null)

      const { data: creatorsData } = await supabase.from('creators').select('*')
      if (creatorsData) {
        setCreators(creatorsData)
        const niches = Array.from(new Set(creatorsData.map((c: any) => c.niche))).sort()
        setAvailableNiches(niches as string[])
      }

      if (user) {
        const { data: savedData } = await supabase.from('saved_creators').select('creator_id')
        if (savedData) setSavedIds(savedData.map((s) => s.creator_id))
      }

      setLoading(false)
    }
    loadData()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    window.location.reload()
  }

  async function logIn() {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setAuthMessage(error.message)
    } else {
      window.location.reload()
    }
  }

  async function signUp() {
    const { error } = await supabase.auth.signUp({ email, password })
    setAuthMessage(error ? error.message : 'Account created! Click Log in.')
  }

  async function toggleSave(creatorId: number) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setShowLogin(true)
      return
    }
    if (savedIds.includes(creatorId)) {
      await supabase.from('saved_creators').delete().eq('creator_id', creatorId)
      setSavedIds(savedIds.filter((id) => id !== creatorId))
    } else {
      await supabase.from('saved_creators').insert({ creator_id: creatorId, user_id: user.id })
      setSavedIds([...savedIds, creatorId])
    }
  }

  const filtered = creators.filter((c) => {
    const matchesText = c.name.toLowerCase().includes(query.toLowerCase()) || c.niche.toLowerCase().includes(query.toLowerCase())
    const matchesNiche = niche === 'all' || c.niche === niche
    const matchesFollowers = c.followers >= minFollowers
    return matchesText && matchesNiche && matchesFollowers
  })

  const nicheColors: Record<string, string> = { fitness: '#e8f5e9', beauty: '#fce4ec', tech: '#e3f2fd', fashion: '#f3e5f5', food: '#fff3e0', travel: '#e0f7fa' }
  const nicheText: Record<string, string> = { fitness: '#2e7d32', beauty: '#c2185b', tech: '#1565c0', fashion: '#6a1b9a', food: '#e65100', travel: '#00838f' }

  return (
    <main style={{ minHeight: '100vh', background: '#fafafa', fontFamily: 'system-ui, sans-serif', padding: '48px 16px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 4, color: '#111' }}>Creator search</h1>
            <p style={{ color: '#777', margin: 0, fontSize: 15 }}>{userEmail ? `Logged in as ${userEmail}` : 'Find creators for your brand'}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="/saved" style={{ fontSize: 14, color: '#111', textDecoration: 'none', padding: '8px 14px', border: '1px solid #ddd', borderRadius: 10 }}>My saved</a>
            {userEmail ? (
              <button onClick={signOut} style={{ fontSize: 14, color: '#111', padding: '8px 14px', border: '1px solid #ddd', borderRadius: 10, background: '#fff', cursor: 'pointer' }}>Sign out</button>
            ) : (
              <button onClick={() => setShowLogin(true)} style={{ fontSize: 14, color: '#fff', padding: '8px 14px', borderRadius: 10, background: '#111', border: 'none', cursor: 'pointer' }}>Log in</button>
            )}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 24 }}>
          <input type="text" placeholder="Search by name or niche..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: '100%', padding: 12, fontSize: 16, borderRadius: 10, border: '1px solid #e0e0e0', marginBottom: 16, boxSizing: 'border-box', outline: 'none' }} />
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={niche} onChange={(e) => setNiche(e.target.value)} style={{ padding: 10, fontSize: 15, borderRadius: 10, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer' }}>
              <option value="all">All niches</option>
              {availableNiches.map((n) => (
                <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>
              ))}
            </select>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 4 }}>Min followers: {minFollowers.toLocaleString()}</label>
              <input type="range" min={0} max={250000} step={1000} value={minFollowers} onChange={(e) => setMinFollowers(Number(e.target.value))} style={{ width: '100%' }} />
            </div>
          </div>
        </div>

        {loading ? (
          <>
            <p style={{ color: '#999', fontSize: 14, marginBottom: 16 }}>Loading creators...</p>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f0f0f0', flexShrink: 0 }}></div>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 14, background: '#f0f0f0', borderRadius: 4, marginBottom: 8, width: '40%' }}></div>
                  <div style={{ height: 12, background: '#f5f5f5', borderRadius: 4, width: '60%' }}></div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <p style={{ color: '#999', fontSize: 14, marginBottom: 16 }}>{filtered.length} {filtered.length === 1 ? 'creator' : 'creators'} found</p>
            {filtered.map((c) => {
              const isSaved = savedIds.includes(c.id)
              return (
                <div key={c.id} style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 600, color: '#888', flexShrink: 0 }}>{c.name.charAt(0).toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <strong style={{ fontSize: 16, color: '#111' }}>{c.name}</strong>
                      <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 20, background: nicheColors[c.niche] || '#eee', color: nicheText[c.niche] || '#555', fontWeight: 500 }}>{c.niche}</span>
                    </div>
                    <p style={{ margin: 0, color: '#777', fontSize: 14 }}>{c.followers.toLocaleString()} followers · age {c.age}</p>
                  </div>
                  <button onClick={() => toggleSave(c.id)} style={{ padding: '8px 14px', fontSize: 13, borderRadius: 10, border: '1px solid ' + (isSaved ? '#111' : '#ddd'), background: isSaved ? '#111' : '#fff', color: isSaved ? '#fff' : '#111', cursor: 'pointer' }}>{isSaved ? 'Saved ✓' : 'Save'}</button>
                </div>
              )
            })}
          </>
        )}
      </div>

      {showLogin && (
        <div onClick={() => setShowLogin(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 100 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, padding: 32, width: '100%', maxWidth: 360, position: 'relative' }}>
            <button onClick={() => setShowLogin(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', fontSize: 22, color: '#999', cursor: 'pointer' }}>×</button>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: '#111' }}>Log in</h2>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: 12, fontSize: 15, borderRadius: 10, border: '1px solid #e0e0e0', marginBottom: 12, boxSizing: 'border-box' }} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: 12, fontSize: 15, borderRadius: 10, border: '1px solid #e0e0e0', marginBottom: 16, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={logIn} style={{ flex: 1, padding: 12, fontSize: 15, borderRadius: 10, border: 'none', background: '#111', color: '#fff', cursor: 'pointer' }}>Log in</button>
              <button onClick={signUp} style={{ flex: 1, padding: 12, fontSize: 15, borderRadius: 10, border: '1px solid #ccc', background: '#fff', color: '#111', cursor: 'pointer' }}>Sign up</button>
            </div>
            {authMessage && <p style={{ marginTop: 16, fontSize: 14, color: '#555' }}>{authMessage}</p>}
          </div>
        </div>
      )}
    </main>
  )
}