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
  const [sortBy, setSortBy] = useState('followers_desc')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [showLogin, setShowLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [welcomeBanner, setWelcomeBanner] = useState(false)

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

      if (typeof window !== 'undefined' && sessionStorage.getItem('justSignedUp')) {
        setWelcomeBanner(true)
        sessionStorage.removeItem('justSignedUp')
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
    if (error) {
      setAuthMessage(error.message)
    } else {
      sessionStorage.setItem('justSignedUp', '1')
      const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password })
      if (loginErr) {
        setAuthMessage('Account created! Click Log in.')
      } else {
        window.location.reload()
      }
    }
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

  const filtered = creators
    .filter((c) => {
      const matchesText = c.name.toLowerCase().includes(query.toLowerCase()) || c.niche.toLowerCase().includes(query.toLowerCase())
      const matchesNiche = niche === 'all' || c.niche === niche
      const matchesFollowers = c.followers >= minFollowers
      return matchesText && matchesNiche && matchesFollowers
    })
    .sort((a, b) => {
      if (sortBy === 'followers_desc') return b.followers - a.followers
      if (sortBy === 'followers_asc') return a.followers - b.followers
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name)
      if (sortBy === 'age_asc') return a.age - b.age
      return 0
    })

  const nicheColors: Record<string, string> = { fitness: '#e8f5e9', beauty: '#fce4ec', tech: '#e3f2fd', fashion: '#f3e5f5', food: '#fff3e0', travel: '#e0f7fa' }
  const nicheText: Record<string, string> = { fitness: '#2e7d32', beauty: '#c2185b', tech: '#1565c0', fashion: '#6a1b9a', food: '#e65100', travel: '#00838f' }
  const nicheEmoji: Record<string, string> = { fitness: '💪', beauty: '💄', tech: '💻', fashion: '👗', food: '🍳', travel: '✈️' }

  return (
    <main style={{ minHeight: '100vh', background: '#fafafa', fontFamily: 'system-ui, sans-serif', padding: '32px 16px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#111', letterSpacing: -0.5 }}>
            Creators<span style={{ color: '#7c3aed' }}>+</span>
          </div>
        </div>

        {welcomeBanner && (
          <div style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)', borderRadius: 14, padding: 20, marginBottom: 20, color: '#fff', position: 'relative' }}>
            <button onClick={() => setWelcomeBanner(false)} style={{ position: 'absolute', top: 10, right: 12, background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: 24, height: 24, borderRadius: '50%', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
            <h3 style={{ margin: 0, marginBottom: 6, fontSize: 17, fontWeight: 700 }}>Welcome to Creators+ 🎉</h3>
            <p style={{ margin: 0, fontSize: 14, opacity: 0.95 }}>Find creators, save your favorites, and track them through your pipeline.</p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 auto', minWidth: 0 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4, color: '#111', margin: 0 }}>Creator search</h1>
            <p style={{ color: '#777', margin: 0, marginTop: 4, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis' }}>{userEmail ? `Logged in as ${userEmail}` : 'Find creators for your brand'}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a href="/dashboard" style={{ fontSize: 13, color: '#111', textDecoration: 'none', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 10, whiteSpace: 'nowrap' }}>Dashboard</a>
            <a href="/saved" style={{ fontSize: 13, color: '#111', textDecoration: 'none', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 10, whiteSpace: 'nowrap' }}>My saved</a>
            {userEmail ? (
              <button onClick={signOut} style={{ fontSize: 13, color: '#111', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 10, background: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}>Sign out</button>
            ) : (
              <button onClick={() => setShowLogin(true)} style={{ fontSize: 13, color: '#fff', padding: '8px 12px', borderRadius: 10, background: '#111', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>Log in</button>
            )}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 20 }}>
          <input type="text" placeholder="Search by name or niche..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: '100%', padding: 12, fontSize: 16, borderRadius: 10, border: '1px solid #e0e0e0', marginBottom: 12, boxSizing: 'border-box', outline: 'none' }} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <select value={niche} onChange={(e) => setNiche(e.target.value)} style={{ flex: '1 1 140px', padding: 10, fontSize: 14, borderRadius: 10, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer' }}>
              <option value="all">All niches</option>
              {availableNiches.map((n) => (
                <option key={n} value={n}>{nicheEmoji[n] || ''} {n.charAt(0).toUpperCase() + n.slice(1)}</option>
              ))}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ flex: '1 1 140px', padding: 10, fontSize: 14, borderRadius: 10, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer' }}>
              <option value="followers_desc">Followers: high → low</option>
              <option value="followers_asc">Followers: low → high</option>
              <option value="name_asc">Name A → Z</option>
              <option value="age_asc">Age: young → old</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 4 }}>Min followers: {minFollowers.toLocaleString()}</label>
            <input type="range" min={0} max={250000} step={1000} value={minFollowers} onChange={(e) => setMinFollowers(Number(e.target.value))} style={{ width: '100%' }} />
          </div>
        </div>

        {loading ? (
          <>
            <p style={{ color: '#999', fontSize: 14, marginBottom: 16 }}>Loading creators...</p>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f0f0f0', flexShrink: 0 }}></div>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 14, background: '#f0f0f0', borderRadius: 4, marginBottom: 8, width: '40%' }}></div>
                  <div style={{ height: 12, background: '#f5f5f5', borderRadius: 4, width: '60%' }}></div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <p style={{ color: '#999', fontSize: 14, marginBottom: 12 }}>{filtered.length} {filtered.length === 1 ? 'creator' : 'creators'} found</p>
            {filtered.map((c) => {
              const isSaved = savedIds.includes(c.id)
              const isHover = hoveredId === c.id
              return (
                <div key={c.id} onMouseEnter={() => setHoveredId(c.id)} onMouseLeave={() => setHoveredId(null)} style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: isHover ? '0 6px 16px rgba(0,0,0,0.10)' : '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12, transform: isHover ? 'translateY(-2px)' : 'translateY(0)', transition: 'all 0.2s ease' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, color: '#888', flexShrink: 0 }}>{c.name.charAt(0).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: 15, color: '#111' }}>{c.name}</strong>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: nicheColors[c.niche] || '#eee', color: nicheText[c.niche] || '#555', fontWeight: 500 }}>{nicheEmoji[c.niche] || ''} {c.niche}</span>
                    </div>
                    <p style={{ margin: 0, color: '#777', fontSize: 13 }}>{c.followers.toLocaleString()} followers · age {c.age}</p>
                  </div>
                  <button onClick={() => toggleSave(c.id)} style={{ padding: '8px 12px', fontSize: 13, borderRadius: 10, border: '1px solid ' + (isSaved ? '#111' : '#ddd'), background: isSaved ? '#111' : '#fff', color: isSaved ? '#fff' : '#111', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>{isSaved ? 'Saved ✓' : 'Save'}</button>
                </div>
              )
            })}
          </>
        )}
      </div>

      {showLogin && (
        <div onClick={() => setShowLogin(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 100 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 360, position: 'relative' }}>
            <button onClick={() => setShowLogin(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', fontSize: 22, color: '#999', cursor: 'pointer' }}>×</button>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 18, color: '#111', marginTop: 0 }}>Log in to Creators<span style={{ color: '#7c3aed' }}>+</span></h2>
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