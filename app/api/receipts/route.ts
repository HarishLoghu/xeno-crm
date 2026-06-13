import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { calculateHealthScore, getHealthLabel } from '@/lib/health-score'
import { updateEngagementProfile } from '@/lib/engagement-profile'
import { askGemini } from '@/lib/gemini'

/**
 * Valid status transitions (forward-only).
 * Each status maps to the set of valid next statuses.
 */
const STATUS_ORDER: Record<string, number> = {
  queued: 0,
  sent: 1,
  delivered: 2,
  opened: 3,
  clicked: 4,
  converted: 5,
  failed: -1, // terminal state
}

const STATUS_TO_CAMPAIGN_FIELD: Record<string, string> = {
  delivered: 'totalDelivered',
  opened: 'totalOpened',
  clicked: 'totalClicked',
  converted: 'totalConverted',
  failed: 'totalFailed',
}

const STATUS_TO_TIMESTAMP: Record<string, string> = {
  sent: 'sentAt',
  delivered: 'deliveredAt',
  opened: 'openedAt',
  clicked: 'clickedAt',
  converted: 'convertedAt',
  failed: 'failedAt',
}

const STATUS_TO_HEALTH_EVENT: Record<string, string> = {
  opened: 'open',
  clicked: 'click',
  converted: 'convert',
}

const STATUS_TO_ENGAGEMENT_EVENT: Record<string, string> = {
  sent: 'sent',
  delivered: 'delivered',
  opened: 'opened',
  clicked: 'clicked',
  converted: 'converted',
  failed: 'failed',
}

/**
 * POST /api/receipts
 * Idempotent delivery receipt callback handler.
 *
 * Body: { receiptId, status, failReason? }
 *
 * Steps:
 * 1. Check receiptId for dedup
 * 2. Forward-only state transitions
 * 3. Update communication record
 * 4. Increment campaign stats
 * 5. Update customer engagement profile
 * 6. Recalculate customer health score
 * 7. Check if all communications complete → trigger autopsy
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { receiptId, event, metadata, communicationId } = body
    const status = body.status || event
    const failReason = body.failReason || metadata?.failReason

    if (!receiptId || !status) {
      return NextResponse.json(
        { error: 'receiptId and status are required' },
        { status: 400 }
      )
    }

    if (!(status in STATUS_ORDER)) {
      return NextResponse.json(
        { error: `Invalid status: ${status}. Valid: ${Object.keys(STATUS_ORDER).join(', ')}` },
        { status: 400 }
      )
    }

    // Step 1: Find communication by communicationId or receiptId
    const communication = communicationId 
      ? await prisma.communication.findUnique({
          where: { id: communicationId },
          include: { customer: true, campaign: true },
        })
      : await prisma.communication.findUnique({
          where: { receiptId },
          include: { customer: true, campaign: true },
        })

    if (!communication) {
      return NextResponse.json(
        { error: 'Communication not found for this receiptId' },
        { status: 404 }
      )
    }

    // Step 2: Forward-only state transition check
    const currentOrder = STATUS_ORDER[communication.status] ?? -1
    const newOrder = STATUS_ORDER[status]

    // Allow failed from any non-terminal state
    if (status !== 'failed') {
      if (newOrder <= currentOrder) {
        // Idempotent — already at this state or past it
        return NextResponse.json({
          message: 'Already processed',
          currentStatus: communication.status,
        })
      }
    } else if (communication.status === 'failed') {
      return NextResponse.json({
        message: 'Already failed',
        currentStatus: communication.status,
      })
    }

    const now = new Date()

    // Step 3: Update communication record
    const updateData: Record<string, unknown> = { status }
    const timestampField = STATUS_TO_TIMESTAMP[status]
    if (timestampField) {
      updateData[timestampField] = now
    }
    if (status === 'failed' && failReason) {
      updateData.failReason = failReason
    }

    await prisma.communication.update({
      where: { id: communication.id },
      data: updateData,
    })

    // Step 4: Increment campaign stats
    const campaignField = STATUS_TO_CAMPAIGN_FIELD[status]
    if (campaignField) {
      await prisma.campaign.update({
        where: { id: communication.campaignId },
        data: {
          [campaignField]: { increment: 1 },
        },
      })
    }

    // Step 5: Update customer engagement profile
    const engagementEvent = STATUS_TO_ENGAGEMENT_EVENT[status]
    if (engagementEvent) {
      const updatedProfile = updateEngagementProfile(
        communication.customer.engagementProfile,
        engagementEvent as 'sent' | 'delivered' | 'opened' | 'clicked' | 'converted' | 'failed',
        communication.channel,
        now
      )

      await prisma.customer.update({
        where: { id: communication.customerId },
        data: { engagementProfile: updatedProfile as any },
      })
    }

    // Step 6: Recalculate customer health score
    const healthEvent = STATUS_TO_HEALTH_EVENT[status]
    if (healthEvent) {
      const customer = await prisma.customer.findUnique({
        where: { id: communication.customerId },
      })

      if (customer) {
        // Get context for health score calculation
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const recentMessages = await prisma.communication.count({
          where: {
            customerId: customer.id,
            createdAt: { gte: sevenDaysAgo },
          },
        })

        const profile = customer.engagementProfile as Record<string, unknown> | null
        const consecutiveIgnores =
          profile && typeof profile === 'object'
            ? (profile.consecutive_ignores as number) || 0
            : 0

        const newScore = calculateHealthScore(
          customer.healthScore,
          healthEvent as 'open' | 'click' | 'convert',
          {
            consecutiveIgnores,
            messagesSentLast7Days: recentMessages,
          }
        )

        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            healthScore: newScore,
            healthLabel: getHealthLabel(newScore),
          },
        })
      }
    }

    // Step 7: Check if all communications are complete → trigger autopsy
    if (['delivered', 'failed', 'converted', 'clicked', 'opened'].includes(status)) {
      await checkAndTriggerAutopsy(communication.campaignId)
    }

    return NextResponse.json({
      message: 'Receipt processed',
      communicationId: communication.id,
      newStatus: status,
    })
  } catch (error) {
    console.error('[POST /api/receipts] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process receipt' },
      { status: 500 }
    )
  }
}

/**
 * Check if all communications in a campaign have reached a terminal state,
 * and if so, generate an autopsy.
 */
async function checkAndTriggerAutopsy(campaignId: string): Promise<void> {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    })

    if (!campaign || campaign.autopsy) return

    // Check if all communications are in a terminal state
    const pendingCount = await prisma.communication.count({
      where: {
        campaignId,
        status: { in: ['queued', 'sent'] },
      },
    })

    if (pendingCount > 0) return

    // All done — generate autopsy
    const stats = {
      totalSent: campaign.totalSent,
      totalDelivered: campaign.totalDelivered,
      totalFailed: campaign.totalFailed,
      totalOpened: campaign.totalOpened,
      totalClicked: campaign.totalClicked,
      totalConverted: campaign.totalConverted,
    }

    try {
      const autopsy = await askGemini(
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

      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          autopsy,
          status: 'completed',
        },
      })
    } catch (aiError) {
      console.error('[Autopsy] AI generation failed, using fallback:', aiError)

      const deliveryRate = stats.totalSent > 0 ? ((stats.totalDelivered / stats.totalSent) * 100).toFixed(1) : '0'
      const openRate = stats.totalDelivered > 0 ? ((stats.totalOpened / stats.totalDelivered) * 100).toFixed(1) : '0'

      const fallbackAutopsy = [
        `Campaign "${campaign.name}" completed: ${stats.totalSent} sent, ${stats.totalDelivered} delivered (${deliveryRate}%).`,
        `Open rate: ${openRate}%, Clicks: ${stats.totalClicked}, Conversions: ${stats.totalConverted}.`,
        `Failed deliveries: ${stats.totalFailed}.`,
        `Review segment targeting and message content for next campaign.`,
      ].join('\n')

      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          autopsy: fallbackAutopsy,
          status: 'completed',
        },
      })
    }
  } catch (error) {
    console.error('[Autopsy] Check failed:', error)
  }
}
