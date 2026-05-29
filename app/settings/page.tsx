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

  useEffect(() => {
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
      <main style={{ minHeight: '100vh', background: '#fafafa', padding: '32px 16px', fontFamily: 'system-ui, sans-serif' }}>
        <p style={{ color: '#999', fontSize: 14, textAlign: 'center' }}>Loading...</p>
      </main>
    )
  }

  if (!userEmail) {
    return (
      <main style={{ minHeight: '100vh', background: '#fafafa', padding: '32px 16px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', background: '#fff', borderRadius: 14, padding: 48, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#111' }}>Please log in</h2>
          <p style={{ color: '#777', fontSize: 14, marginBottom: 20 }}>You need an account to save settings.</p>
          <a href="/" style={{ display: 'inline-block', fontSize: 14, color: '#fff', textDecoration: 'none', padding: '12px 20px', background: '#111', borderRadius: 10 }}>Back to home</a>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#fafafa', fontFamily: 'system-ui, sans-serif', padding: '32px 16px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#111', letterSpacing: -0.5 }}>
            Creators<span style={{ color: '#7c3aed' }}>+</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 auto', minWidth: 0 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4, color: '#111', margin: 0 }}>Settings</h1>
            <p style={{ color: '#777', margin: 0, marginTop: 4, fontSize: 14 }}>Customize how your outreach emails sound</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a href="/" style={{ fontSize: 13, color: '#111', textDecoration: 'none', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 10, whiteSpace: 'nowrap' }}>Search</a>
            <a href="/saved" style={{ fontSize: 13, color: '#111', textDecoration: 'none', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 10, whiteSpace: 'nowrap' }}>My saved</a>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 4, color: '#111' }}>Your brand</h2>
          <p style={{ color: '#777', fontSize: 13, marginTop: 0, marginBottom: 20 }}>Auto-fills the [YOUR BRAND] and [YOUR NAME] placeholders in emails.</p>

          <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 6, fontWeight: 500 }}>Brand name</label>
          <input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="e.g. Glow Beauty Co." style={{ width: '100%', padding: 11, fontSize: 14, borderRadius: 10, border: '1px solid #e0e0e0', marginBottom: 16, boxSizing: 'border-box', outline: 'none' }} />

          <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 6, fontWeight: 500 }}>Your name</label>
          <input type="text" value={yourName} onChange={(e) => setYourName(e.target.value)} placeholder="e.g. Ida from Glow" style={{ width: '100%', padding: 11, fontSize: 14, borderRadius: 10, border: '1px solid #e0e0e0', marginBottom: 24, boxSizing: 'border-box', outline: 'none' }} />

          <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 4, color: '#111' }}>Brand voice</h2>
          <p style={{ color: '#777', fontSize: 13, marginTop: 0, marginBottom: 12 }}>Describe how you want your emails to sound. The AI will match this tone.</p>

          <textarea
            value={brandVoice}
            onChange={(e) => setBrandVoice(e.target.value)}
            placeholder="e.g. Fun and casual, like talking to a friend. Use emojis sparingly. Avoid corporate jargon. Always end with something playful."
            style={{ width: '100%', padding: 11, fontSize: 14, borderRadius: 10, border: '1px solid #e0e0e0', minHeight: 100, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', outline: 'none', lineHeight: 1.5 }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
            <button onClick={saveSettings} disabled={saving} style={{ padding: '12px 22px', fontSize: 14, borderRadius: 10, border: 'none', background: saving ? '#666' : '#111', color: '#fff', cursor: saving ? 'wait' : 'pointer', fontWeight: 600 }}>
              {saving ? 'Saving...' : 'Save settings'}
            </button>
            {savedMsg && <span style={{ fontSize: 14, color: savedMsg.startsWith('Error') ? '#dc2626' : '#2e7d32' }}>{savedMsg}</span>}
          </div>
        </div>
      </div>
    </main>
  )
}