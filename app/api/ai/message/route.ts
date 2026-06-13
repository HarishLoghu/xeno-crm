import { NextRequest, NextResponse } from 'next/server'
import { askGemini } from '@/lib/gemini'

/**
 * POST /api/ai/message
 * Generate a campaign message using Gemini AI.
 *
 * Body: { goal, segmentDescription, channel, brandName? }
 * Returns: { message, subject }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { goal, segmentDescription, channel, brandName } = body

    if (!goal || !segmentDescription || !channel) {
      return NextResponse.json(
        { error: 'goal, segmentDescription, and channel are required' },
        { status: 400 }
      )
    }

    const validChannels = ['email', 'sms', 'push', 'whatsapp', 'rcs']
    if (!validChannels.includes(channel)) {
      return NextResponse.json(
        { error: `Invalid channel. Must be one of: ${validChannels.join(', ')}` },
        { status: 400 }
      )
    }

    const channelGuidelines: Record<string, string> = {
      email: 'Write a compelling email body (2-3 short paragraphs). Include a subject line. Use {{name}} for personalization.',
      sms: 'Write a concise SMS message (max 160 characters). Use {{name}} for personalization. Include a clear CTA.',
      push: 'Write a short push notification (max 100 characters title, max 200 characters body). Use {{name}} for personalization.',
      whatsapp: 'Write a friendly, concise WhatsApp message. Use emojis. Use {{name}} for personalization. End with a clear CTA.',
      rcs: 'Write a rich conversational message. Use {{name}} for personalization. Include a clear CTA.',
    }

    // Parse AI response
    let parsed: { message: string; subject: string }

    try {
      const aiResponse = await askGemini(
        `You are a marketing copywriter for ${brandName || 'a modern brand'}. Generate a campaign message.

Channel: ${channel}
${channelGuidelines[channel]}

Output format (JSON only, no markdown code blocks):
{
  "message": "The message body with {{name}} placeholders",
  "subject": "Email subject line (only for email channel, empty string for others)"
}

Keep the tone friendly, professional, and action-oriented.
For Indian audience, keep language simple and relatable.
Return ONLY valid JSON.`,
        `Goal: ${goal}\nTarget Segment: ${segmentDescription}`
      )

      const cleaned = aiResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      parsed = JSON.parse(cleaned)
    } catch (err: any) {
      console.warn('AI failed, using fallback message:', err.message)
      parsed = {
        message: `Hi {{name}}, we have a special offer for you regarding: ${goal}. Reply to this message to claim it!`,
        subject: channel === 'email' ? 'Special Offer Just For You' : '',
      }
    }

    return NextResponse.json({
      message: parsed.message,
      subject: parsed.subject || '',
    })
  } catch (error) {
    console.error('[POST /api/ai/message] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate message' },
      { status: 500 }
    )
  }
}
