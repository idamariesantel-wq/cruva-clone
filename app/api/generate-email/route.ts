import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { creator, notes, settings } = await req.json()

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const brandName = settings?.brand_name || '[YOUR BRAND]'
    const yourName = settings?.your_name || '[YOUR NAME]'
    const brandVoice = settings?.brand_voice || ''

    const prompt = `Write a short, warm, personalized outreach email from a brand to a TikTok creator for a potential partnership.

Sender details:
- Brand name: ${brandName}
- Sender's name: ${yourName}
${brandVoice ? `- Brand voice / tone instructions: ${brandVoice}` : ''}

Creator details:
- Name: ${creator.name}
- Niche: ${creator.niche}
- Followers: ${creator.followers.toLocaleString()}
- Age: ${creator.age}
${notes ? `- Internal notes about them: ${notes}` : ''}

Requirements:
- Keep it under 150 words
- Sound human and friendly, not corporate or salesy
- Mention something specific about their niche
- Offer: free product/sample + commission on sales they drive
- End with a low-pressure call to reply
- Sign off as "${yourName}" representing "${brandName}"
- Do NOT use [YOUR BRAND] or [YOUR NAME] placeholders — use the real values above
- Return ONLY the email body, no subject line, no greeting wrappers, no markdown

${brandVoice ? `Important: match this brand voice throughout: "${brandVoice}"` : ''}

Just write the email.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return NextResponse.json({ error: 'Anthropic API error: ' + errText }, { status: 500 })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || ''

    return NextResponse.json({ body: text.trim() })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}