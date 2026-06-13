import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { askGemini } from '@/lib/gemini'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const campaign = await prisma.campaign.findUnique({
      where: { id },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const stats = {
      totalSent: campaign.totalSent,
      totalDelivered: campaign.totalDelivered,
      totalFailed: campaign.totalFailed,
      totalOpened: campaign.totalOpened,
      totalClicked: campaign.totalClicked,
      totalConverted: campaign.totalConverted,
    }

    let autopsy = ""
    try {
      autopsy = await askGemini(
        `You are a marketing analytics expert. Generate a concise 4-line campaign autopsy report.
Line 1: One-sentence performance summary.
Line 2: Key strength of the campaign.
Line 3: Main weakness or area of concern.
Line 4: One actionable recommendation for the next campaign.
Keep it data-driven and specific.`,
        `Campaign: "${campaign.name}"
Goal: ${campaign.goal}
Channel: ${campaign.channel}
Stats: Sent=${stats.totalSent}, Delivered=${stats.totalDelivered}, Failed=${stats.totalFailed}, Opened=${stats.totalOpened}, Clicked=${stats.totalClicked}, Converted=${stats.totalConverted}
Delivery Rate: ${stats.totalSent > 0 ? ((stats.totalDelivered / stats.totalSent) * 100).toFixed(1) : 0}%
Open Rate: ${stats.totalDelivered > 0 ? ((stats.totalOpened / stats.totalDelivered) * 100).toFixed(1) : 0}%
Click Rate: ${stats.totalOpened > 0 ? ((stats.totalClicked / stats.totalOpened) * 100).toFixed(1) : 0}%
Conversion Rate: ${stats.totalSent > 0 ? ((stats.totalConverted / stats.totalSent) * 100).toFixed(1) : 0}%`
      )
    } catch (error) {
      console.error('[Autopsy] AI generation failed, using fallback:', error)
      const deliveryRate = stats.totalSent > 0 ? ((stats.totalDelivered / stats.totalSent) * 100).toFixed(1) : '0'
      const openRate = stats.totalDelivered > 0 ? ((stats.totalOpened / stats.totalDelivered) * 100).toFixed(1) : '0'
      
      autopsy = [
        `Campaign "${campaign.name}" completed: ${stats.totalSent} sent, ${stats.totalDelivered} delivered (${deliveryRate}%).`,
        `Open rate: ${openRate}%, Clicks: ${stats.totalClicked}, Conversions: ${stats.totalConverted}.`,
        `Failed deliveries: ${stats.totalFailed}.`,
        `Review segment targeting and message content for next campaign.`,
      ].join('\n')
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: { autopsy },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[POST /api/campaigns/[id]/autopsy]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
