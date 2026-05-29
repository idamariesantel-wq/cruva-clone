'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

export default function Saved() {
  const [saved, setSaved] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [confirmRemove, setConfirmRemove] = useState<{ id: number; name: string } | null>(null)
  const [emailDraft, setEmailDraft] = useState<{ creator: any; notes: string; subject: string; body: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [savedIndicator, setSavedIndicator] = useState<number | null>(null)
  const [userSettings, setUserSettings] = useState<any>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const notesTimers = useRef<Record<number, any>>({})

  useEffect(() => {
    const saved = (typeof window !== 'undefined' ? localStorage.getItem('theme') : null) as 'light' | 'dark' | null
    const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    const initial = saved || (prefersDark ? 'dark' : 'light')
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial)
    loadSaved()
    loadSettings()
  }, [])

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
  }

  async function loadSettings() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    if (data) setUserSettings(data)
  }

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
    setConfirmRemove(null)
  }

  async function updateStatus(savedId: number, newStatus: string) {
    const update: any = { status: newStatus }
    if (newStatus === 'contacted') update.last_contacted = new Date().toISOString()
    await supabase.from('saved_creators').update(update).eq('id', savedId)
    setSaved((prev) => prev.map((s) => (s.id === savedId ? { ...s, ...update } : s)))
  }

  function handleNotesChange(savedId: number, newNotes: string) {
    setSaved((prev) => prev.map((s) => (s.id === savedId ? { ...s, notes: newNotes } : s)))
    if (notesTimers.current[savedId]) clearTimeout(notesTimers.current[savedId])
    notesTimers.current[savedId] = setTimeout(async () => {
      await supabase.from('saved_creators').update({ notes: newNotes }).eq('id', savedId)
      setSavedIndicator(savedId)
      setTimeout(() => setSavedIndicator(null), 1500)
    }, 500)
  }

  function generateEmail(c: any, notes: string) {
    const nicheHooks: Record<string, string> = {
      fitness: "Your fitness content really stands out — the way you mix routines with honest energy is exactly what we look for.",
      beauty: "Your beauty content is genuinely refreshing — you have a clear point of view that resonates with your audience.",
      tech: "Your tech reviews are super sharp — clear, honest, and you actually understand what your audience needs to know.",
      fashion: "Your fashion content has a really distinctive style — it's easy to see why your audience trusts your taste.",
      food: "Your food content makes people actually want to cook — that's such a rare quality on TikTok these days.",
      travel: "Your travel content has such an authentic feel — your audience clearly trusts your recommendations.",
    }
    const hook = nicheHooks[c.niche] || `Your ${c.niche} content really caught our attention.`
    const brandName = userSettings?.brand_name || '[YOUR BRAND]'
    const yourName = userSettings?.your_name || '[YOUR NAME]'

    const subject = `Partnership opportunity — ${c.name}`
    const body = `Hi ${c.name},

${hook}

I'm reaching out from ${brandName} — we're looking to partner with creators in the ${c.niche} space, and your ${c.followers.toLocaleString()} followers are exactly the audience we'd love to connect with.

Here's what we'd love to offer:
- A free product/sample to try out
- A commission on every sale you generate through your custom link
- Creative freedom — you know your audience better than we do

If this sounds interesting, just reply and I'll send over the details. No pressure either way.

Thanks for considering it,
${yourName}`

    setEmailDraft({ creator: c, notes, subject, body })
    setCopied(false)
    setAiError('')
  }

  async function regenerateWithAI() {
    if (!emailDraft) return
    setAiLoading(true)
    setAiError('')
    try {
      const res = await fetch('/api/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creator: emailDraft.creator, notes: emailDraft.notes, settings: userSettings }),
      })
      const data = await res.json()
      if (!res.ok) setAiError(data.error || 'Failed to generate')
      else setEmailDraft({ ...emailDraft, body: data.body })
    } catch (err: any) {
      setAiError(err.message || 'Network error')
    }
    setAiLoading(false)
  }

  function copyToClipboard() {
    if (!emailDraft) return
    const text = `Subject: ${emailDraft.subject}\n\n${emailDraft.body}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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

  const settingsIncomplete = !userSettings?.brand_name || !userSettings?.your_name

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui, sans-serif', padding: '32px 16px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
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
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4, color: 'var(--text)', margin: 0 }}>My saved</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, marginTop: 4, fontSize: 14 }}>Your creator pipeline</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a href="/dashboard" style={{ fontSize: 13, color: 'var(--text)', textDecoration: 'none', padding: '8px 12px', border: '1px solid var(--button-secondary-border)', borderRadius: 10, whiteSpace: 'nowrap', background: 'var(--button-secondary-bg)' }}>Dashboard</a>
            <a href="/settings" style={{ fontSize: 13, color: 'var(--text)', textDecoration: 'none', padding: '8px 12px', border: '1px solid var(--button-secondary-border)', borderRadius: 10, whiteSpace: 'nowrap', background: 'var(--button-secondary-bg)' }}>Settings</a>
            <a href="/" style={{ fontSize: 13, color: 'var(--text)', textDecoration: 'none', padding: '8px 12px', border: '1px solid var(--button-secondary-border)', borderRadius: 10, whiteSpace: 'nowrap', background: 'var(--button-secondary-bg)' }}>Search</a>
          </div>
        </div>

        {saved.length > 0 && (
          <input type="text" placeholder="Search your saved creators..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: '100%', padding: 12, fontSize: 15, borderRadius: 10, border: '1px solid var(--border)', marginBottom: 16, boxSizing: 'border-box', outline: 'none', background: 'var(--input-bg)', color: 'var(--text)' }} />
        )}

        {loading ? (
          <p style={{ color: 'var(--text-faint)', fontSize: 14 }}>Loading...</p>
        ) : saved.length === 0 ? (
          <div style={{ background: 'var(--card-bg)', borderRadius: 14, padding: 48, textAlign: 'center', boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>★</div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>No saved creators yet</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>Find creators you'd like to work with and save them here.</p>
            <a href="/" style={{ display: 'inline-block', fontSize: 14, color: 'var(--button-text)', textDecoration: 'none', padding: '12px 20px', background: 'var(--button-bg)', borderRadius: 10 }}>Browse creators</a>
          </div>
        ) : (
          <>
            <p style={{ color: 'var(--text-faint)', fontSize: 14, marginBottom: 12 }}>{filtered.length} of {saved.length} {saved.length === 1 ? 'creator' : 'creators'}</p>
            {filtered.map((s) => {
              const c = s.creators
              const statusInfo = statusOptions.find((opt) => opt.value === s.status) || statusOptions[0]
              const isHover = hoveredId === s.id
              const lastContactedStr = formatDate(s.last_contacted)
              const showSaved = savedIndicator === s.id
              return (
                <div key={s.id} onMouseEnter={() => setHoveredId(s.id)} onMouseLeave={() => setHoveredId(null)} style={{ background: 'var(--card-bg)', borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: isHover ? 'var(--shadow-hover)' : 'var(--shadow)', transform: isHover ? 'translateY(-2px)' : 'translateY(0)', transition: 'all 0.2s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--skeleton-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, color: 'var(--text-muted)', flexShrink: 0 }}>{c.name.charAt(0).toUpperCase()}</div>
                    <div style={{ flex: '1 1 140px', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: 15, color: 'var(--text)' }}>{c.name}</strong>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: nicheColors[c.niche] || '#eee', color: nicheText[c.niche] || '#555', fontWeight: 500 }}>{nicheEmoji[c.niche] || ''} {c.niche}</span>
                      </div>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>{c.followers.toLocaleString()} followers · age {c.age}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => generateEmail(c, s.notes || '')} style={{ padding: '8px 12px', fontSize: 13, borderRadius: 10, border: 'none', background: '#7c3aed', color: '#fff', cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap' }}>✉️ Email</button>
                      <button onClick={() => setConfirmRemove({ id: s.id, name: c.name })} style={{ padding: '8px 12px', fontSize: 13, borderRadius: 10, border: '1px solid var(--button-secondary-border)', background: 'var(--button-secondary-bg)', color: 'var(--text)', cursor: 'pointer', whiteSpace: 'nowrap' }}>Remove</button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10, paddingBottom: 10, borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Status:</span>
                    <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: statusInfo.bg, color: statusInfo.color, fontWeight: 500 }}>{statusInfo.label}</span>
                    {lastContactedStr && <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>· last contacted {lastContactedStr}</span>}
                    <select value={s.status || 'to_contact'} onChange={(e) => updateStatus(s.id, e.target.value)} style={{ marginLeft: 'auto', padding: '6px 10px', fontSize: 13, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', cursor: 'pointer' }}>
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ paddingTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>Notes</label>
                      {showSaved && <span style={{ fontSize: 12, color: '#2e7d32' }}>✓ Saved</span>}
                    </div>
                    <textarea
                      value={s.notes || ''}
                      onChange={(e) => handleNotesChange(s.id, e.target.value)}
                      placeholder="Add notes about this creator..."
                      style={{ width: '100%', padding: 10, fontSize: 14, borderRadius: 8, border: '1px solid var(--border)', boxSizing: 'border-box', resize: 'vertical', minHeight: 50, fontFamily: 'inherit', outline: 'none', background: 'var(--input-bg)', color: 'var(--text)' }}
                    />
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {confirmRemove && (
        <div onClick={() => setConfirmRemove(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 100 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--card-bg)', borderRadius: 14, padding: 24, width: '100%', maxWidth: 360 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginTop: 0, marginBottom: 8, color: 'var(--text)' }}>Remove {confirmRemove.name}?</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 0, marginBottom: 18 }}>This will delete their status and notes too. This can't be undone.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmRemove(null)} style={{ flex: 1, padding: 12, fontSize: 14, borderRadius: 10, border: '1px solid var(--button-secondary-border)', background: 'var(--button-secondary-bg)', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => unsave(confirmRemove.id)} style={{ flex: 1, padding: 12, fontSize: 14, borderRadius: 10, border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer' }}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {emailDraft && (
        <div onClick={() => setEmailDraft(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 100 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--card-bg)', borderRadius: 14, padding: 24, width: '100%', maxWidth: 520, position: 'relative', maxHeight: '85vh', overflowY: 'auto' }}>
            <button onClick={() => setEmailDraft(null)} style={{ position: 'absolute', top: 10, right: 14, background: 'none', border: 'none', fontSize: 22, color: 'var(--text-faint)', cursor: 'pointer' }}>×</button>
            <h2 style={{ fontSize: 19, fontWeight: 700, marginTop: 0, marginBottom: 4, color: 'var(--text)' }}>Email draft</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 0, marginBottom: 16 }}>For {emailDraft.creator.name} · {emailDraft.creator.niche}</p>

            {settingsIncomplete && (
              <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 13, color: '#a66a00' }}>
                💡 Set your brand name and your name in <a href="/settings" style={{ color: '#7c3aed', fontWeight: 600 }}>Settings</a> so emails auto-fill.
              </div>
            )}

            <button onClick={regenerateWithAI} disabled={aiLoading} style={{ width: '100%', padding: 12, fontSize: 14, borderRadius: 10, border: 'none', background: aiLoading ? '#a78bfa' : '#7c3aed', color: '#fff', cursor: aiLoading ? 'wait' : 'pointer', fontWeight: 600, marginBottom: 16 }}>
              {aiLoading ? 'Generating with AI...' : '✨ Make it personal with AI'}
            </button>

            {aiError && <p style={{ color: '#dc2626', fontSize: 13, marginTop: 0, marginBottom: 14 }}>⚠ {aiError}</p>}

            <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Subject</label>
            <input value={emailDraft.subject} onChange={(e) => setEmailDraft({ ...emailDraft, subject: e.target.value })} style={{ width: '100%', padding: 10, fontSize: 14, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 14, boxSizing: 'border-box', fontFamily: 'inherit', background: 'var(--input-bg)', color: 'var(--text)' }} />

            <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Message</label>
            <textarea value={emailDraft.body} onChange={(e) => setEmailDraft({ ...emailDraft, body: e.target.value })} style={{ width: '100%', padding: 12, fontSize: 14, borderRadius: 8, border: '1px solid var(--border)', minHeight: 260, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5, background: 'var(--input-bg)', color: 'var(--text)' }} />

            <p style={{ color: 'var(--text-faint)', fontSize: 12, marginTop: 10, marginBottom: 18 }}>Feel free to edit before sending.</p>

            <button onClick={copyToClipboard} style={{ width: '100%', padding: 14, fontSize: 15, borderRadius: 10, border: 'none', background: copied ? '#2e7d32' : 'var(--button-bg)', color: copied ? '#fff' : 'var(--button-text)', cursor: 'pointer', fontWeight: 600 }}>
              {copied ? '✓ Copied to clipboard!' : 'Copy to clipboard'}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}