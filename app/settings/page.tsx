'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Settings() {
  const [brandName, setBrandName] = useState('')
  const [yourName, setYourName] = useState('')
  const [brandVoice, setBrandVoice] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const savedTheme = (typeof window !== 'undefined' ? localStorage.getItem('theme') : null) as 'light' | 'dark' | null
    const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    const initial = savedTheme || (prefersDark ? 'dark' : 'light')
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial)

    async function loadSettings() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      setUserEmail(user.email ?? null)

      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (data) {
        setBrandName(data.brand_name || '')
        setYourName(data.your_name || '')
        setBrandVoice(data.brand_voice || '')
      }
      setLoading(false)
    }
    loadSettings()
  }, [])

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
  }

  async function saveSettings() {
    setSaving(true)
    setSavedMsg('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSavedMsg('You need to be logged in.')
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        brand_name: brandName,
        your_name: yourName,
        brand_voice: brandVoice,
      }, { onConflict: 'user_id' })

    if (error) {
      setSavedMsg('Error: ' + error.message)
    } else {
      setSavedMsg('✓ Saved')
      setTimeout(() => setSavedMsg(''), 2000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '32px 16px', fontFamily: 'system-ui, sans-serif' }}>
        <p style={{ color: 'var(--text-faint)', fontSize: 14, textAlign: 'center' }}>Loading...</p>
      </main>
    )
  }

  if (!userEmail) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '32px 16px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', background: 'var(--card-bg)', borderRadius: 14, padding: 48, textAlign: 'center', boxShadow: 'var(--shadow)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>Please log in</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>You need an account to save settings.</p>
          <a href="/" style={{ display: 'inline-block', fontSize: 14, color: 'var(--button-text)', textDecoration: 'none', padding: '12px 20px', background: 'var(--button-bg)', borderRadius: 10 }}>Back to home</a>
        </div>
      </main>
    )
  }

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
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4, color: 'var(--text)', margin: 0 }}>Settings</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, marginTop: 4, fontSize: 14 }}>Customize how your outreach emails sound</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a href="/" style={{ fontSize: 13, color: 'var(--text)', textDecoration: 'none', padding: '8px 12px', border: '1px solid var(--button-secondary-border)', borderRadius: 10, whiteSpace: 'nowrap', background: 'var(--button-secondary-bg)' }}>Search</a>
            <a href="/saved" style={{ fontSize: 13, color: 'var(--text)', textDecoration: 'none', padding: '8px 12px', border: '1px solid var(--button-secondary-border)', borderRadius: 10, whiteSpace: 'nowrap', background: 'var(--button-secondary-bg)' }}>My saved</a>
          </div>
        </div>

        <div style={{ background: 'var(--card-bg)', borderRadius: 14, padding: 24, boxShadow: 'var(--shadow)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 4, color: 'var(--text)' }}>Your brand</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 0, marginBottom: 20 }}>Auto-fills the [YOUR BRAND] and [YOUR NAME] placeholders in emails.</p>

          <label style={{ fontSize: 13, color: 'var(--text)', display: 'block', marginBottom: 6, fontWeight: 500 }}>Brand name</label>
          <input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="e.g. Glow Beauty Co." style={{ width: '100%', padding: 11, fontSize: 14, borderRadius: 10, border: '1px solid var(--border)', marginBottom: 16, boxSizing: 'border-box', outline: 'none', background: 'var(--input-bg)', color: 'var(--text)' }} />

          <label style={{ fontSize: 13, color: 'var(--text)', display: 'block', marginBottom: 6, fontWeight: 500 }}>Your name</label>
          <input type="text" value={yourName} onChange={(e) => setYourName(e.target.value)} placeholder="e.g. Ida from Glow" style={{ width: '100%', padding: 11, fontSize: 14, borderRadius: 10, border: '1px solid var(--border)', marginBottom: 24, boxSizing: 'border-box', outline: 'none', background: 'var(--input-bg)', color: 'var(--text)' }} />

          <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 4, color: 'var(--text)' }}>Brand voice</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 0, marginBottom: 12 }}>Describe how you want your emails to sound. The AI will match this tone.</p>

          <textarea
            value={brandVoice}
            onChange={(e) => setBrandVoice(e.target.value)}
            placeholder="e.g. Fun and casual, like talking to a friend. Use emojis sparingly. Avoid corporate jargon."
            style={{ width: '100%', padding: 11, fontSize: 14, borderRadius: 10, border: '1px solid var(--border)', minHeight: 100, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', outline: 'none', lineHeight: 1.5, background: 'var(--input-bg)', color: 'var(--text)' }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
            <button onClick={saveSettings} disabled={saving} style={{ padding: '12px 22px', fontSize: 14, borderRadius: 10, border: 'none', background: saving ? '#666' : 'var(--button-bg)', color: 'var(--button-text)', cursor: saving ? 'wait' : 'pointer', fontWeight: 600 }}>
              {saving ? 'Saving...' : 'Save settings'}
            </button>
            {savedMsg && <span style={{ fontSize: 14, color: savedMsg.startsWith('Error') ? '#dc2626' : '#2e7d32' }}>{savedMsg}</span>}
          </div>
        </div>
      </div>
    </main>
  )
}