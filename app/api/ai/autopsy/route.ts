import { NextRequest, NextResponse } from 'next/server'
import { askGemini } from '@/lib/gemini'

/**
 * POST /api/ai/autopsy
 * Generate a 4-line campaign autopsy using Gemini AI.
 *
 * Body: { campaignName, stats }
 * stats: { totalSent, totalDelivered, totalFailed, totalOpened, totalClicked, totalConverted }
 * Returns: { autopsy }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaignName, stats } = body

    if (!campaignName || !stats) {
      return NextResponse.json(
        { error: 'campaignName and stats are required' },
        { status: 400 }
      )
    }

    const {
      totalSent = 0,
      totalDelivered = 0,
      totalFailed = 0,
      totalOpened = 0,
      totalClicked = 0,
      totalConverted = 0,
    } = stats

    const deliveryRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : '0'
    const openRate = totalDelivered > 0 ? ((totalOpened / totalDelivered) * 100).toFixed(1) : '0'
    const clickRate = totalOpened > 0 ? ((totalClicked / totalOpened) * 100).toFixed(1) : '0'
    const conversionRate = totalSent > 0 ? ((totalConverted / totalSent) * 100).toFixed(1) : '0'

    let autopsy: string;
    try {
      autopsy = await askGemini(
        `You are a marketing analytics expert. Generate a concise 4-line campaign autopsy report.
Line 1: One-sentence performance summary with key numbers.
Line 2: Key strength of the campaign.
Line 3: Main weakness or area of concern.
Line 4: One actionable recommendation for the next campaign.
Keep it data-driven, specific, and concise. Do not use bullet points or labels — just 4 plain sentences, one per line.`,
        `Campaign: "${campaignName}"
Stats: Sent=${totalSent}, Delivered=${totalDelivered}, Failed=${totalFailed}, Opened=${totalOpened}, Clicked=${totalClicked}, Converted=${totalConverted}
Delivery Rate: ${deliveryRate}%
Open Rate: ${openRate}%
Click Rate: ${clickRate}%
Conversion Rate: ${conversionRate}%`
      )
    } catch (err: any) {
      console.warn('AI failed, using fallback autopsy:', err.message)
      autopsy = `The campaign achieved a ${conversionRate}% conversion rate with ${totalSent} total sends.
The delivery rate of ${deliveryRate}% indicates strong channel reach.
Engagement may drop if sending frequency is too high.
Consider segmenting the audience further in the next send.`
    }

    return NextResponse.json({ autopsy: autopsy.trim() })
  } catch (error) {
    console.error('[POST /api/ai/autopsy] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate autopsy' },
      { status: 500 }
    )
  }
}
