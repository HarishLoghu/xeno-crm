import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const CHANNEL_STUB_URL = process.env.CHANNEL_STUB_URL || 'http://localhost:3001'

/**
 * POST /api/campaigns/[id]/send
 * Trigger a campaign send.
 *
 * Steps:
 * 1. Find all customers matching segmentRule
 * 2. Filter out suppressed customers (healthScore < 40 or messaged 3+ times in 7 days)
 * 3. Create Communication records for each non-suppressed customer
 * 4. Call channel stub for each (POST to CHANNEL_STUB_URL/send)
 * 5. Update campaign status to 'running' and totalSent
 * 6. Return { sent, suppressed, total }
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch the campaign
    const campaign = await prisma.campaign.findUnique({ where: { id } })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (campaign.status === 'running' || campaign.status === 'completed') {
      return NextResponse.json(
        { error: `Campaign is already ${campaign.status}` },
        { status: 400 }
      )
    }

    // Step 1: Find customers matching segment rules
    const segmentRule = campaign.segmentRule as Record<string, unknown>
    const whereClause = buildWhereClause(segmentRule)
    const allCustomers = await prisma.customer.findMany({ where: whereClause })

    // Step 2: Filter out suppressed customers
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const customersWithRecentMessages = await prisma.communication.groupBy({
      by: ['customerId'],
      where: {
        customerId: { in: allCustomers.map((c) => c.id) },
        createdAt: { gte: sevenDaysAgo },
      },
      _count: { id: true },
    })

    const recentMessageCountMap = new Map(
      customersWithRecentMessages.map((g) => [g.customerId, g._count.id])
    )

    const eligible: typeof allCustomers = []
    const suppressed: typeof allCustomers = []

    for (const customer of allCustomers) {
      const recentCount = recentMessageCountMap.get(customer.id) || 0
      const isBurned = customer.healthScore < 40
      const isOverMessaged = recentCount >= 3

      if (isBurned || isOverMessaged) {
        suppressed.push(customer)
      } else {
        eligible.push(customer)
      }
    }

    if (eligible.length === 0) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          status: 'completed',
          totalSent: 0,
          autopsy: 'Campaign was aborted because there were no eligible customers left after health score and frequency suppression filtering.',
        },
      })
      return NextResponse.json({
        sent: 0,
        suppressed: suppressed.length,
        total: allCustomers.length,
        message: 'No eligible customers to send to',
      })
    }

    // Step 3: Create communication records sequentially to avoid connection pool exhaustion
    const communications = []
    for (const customer of eligible) {
      const comm = await prisma.communication.create({
        data: {
          campaignId: campaign.id,
          customerId: customer.id,
          channel: campaign.channel,
          message: personalize(campaign.messageTemplate, customer),
          status: 'queued',
        },
      })
      communications.push(comm)
    }

    // Step 4: Send to channel stub
    const sendPromises = communications.map(async (comm) => {
      try {
        const response = await fetch(`${CHANNEL_STUB_URL}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: `job_${comm.id}`,
            communicationId: comm.id,
            customerId: comm.customerId,
            channel: comm.channel,
            message: comm.message,
            crmCallbackUrl: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/receipts` : 'http://localhost:3000/api/receipts',
          }),
        })

        if (response.ok) {
          const data = await response.json()
          // Update communication with receipt ID if provided
          if (data.receiptId) {
            await prisma.communication.update({
              where: { id: comm.id },
              data: {
                receiptId: data.receiptId,
                status: 'sent',
                sentAt: new Date(),
              },
            })
          }
        }
      } catch (err) {
        console.error(`[Campaign Send] Failed to send comm ${comm.id}:`, err)
        // Mark as sent anyway — the receipt callback will handle status
        await prisma.communication.update({
          where: { id: comm.id },
          data: { status: 'sent', sentAt: new Date() },
        })
      }
    })

    await Promise.allSettled(sendPromises)

    // Step 5: Update campaign status
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status: 'running',
        totalSent: eligible.length,
      },
    })

    // Step 6: Return results
    return NextResponse.json({
      sent: eligible.length,
      suppressed: suppressed.length,
      total: allCustomers.length,
    })
  } catch (error) {
    console.error('[POST /api/campaigns/[id]/send] Error:', error)
    return NextResponse.json(
      { error: 'Failed to send campaign' },
      { status: 500 }
    )
  }
}

/**
 * Convert segment rule JSON into a Prisma where clause.
 *
 * Supported rule format:
 * {
 *   "field": "healthLabel",
 *   "operator": "equals",
 *   "value": "Healthy",
 *   "logic": "AND",
 *   "rules": [...]
 * }
 */
function buildWhereClause(
  rule: Record<string, unknown>
): Record<string, unknown> {
  // If it has nested rules with logic
  if (rule.rules && Array.isArray(rule.rules)) {
    const logic = (rule.logic as string)?.toUpperCase() || 'AND'
    const clauses = (rule.rules as Record<string, unknown>[]).map(buildWhereClause)

    if (logic === 'OR') {
      return { OR: clauses }
    }
    return { AND: clauses }
  }

  // Single rule
  const field = rule.field as string
  const operator = rule.operator as string
  const value = rule.value

  if (!field || !operator) return {}

  switch (operator) {
    case 'equals':
      return { [field]: value }
    case 'not_equals':
      return { [field]: { not: value } }
    case 'contains':
      return { [field]: { contains: value, mode: 'insensitive' } }
    case 'gt':
    case 'greater_than':
      return { [field]: { gt: Number(value) } }
    case 'gte':
    case 'greater_than_equals':
      return { [field]: { gte: Number(value) } }
    case 'lt':
    case 'less_than':
      return { [field]: { lt: Number(value) } }
    case 'lte':
    case 'less_than_equals':
      return { [field]: { lte: Number(value) } }
    case 'in':
      return { [field]: { in: Array.isArray(value) ? value : [value] } }
    case 'not_in':
      return { [field]: { notIn: Array.isArray(value) ? value : [value] } }
    default:
      return { [field]: value }
  }
}

/**
 * Simple template personalization — replaces {{name}}, {{email}} etc.
 */
function personalize(
  template: string,
  customer: { name: string; email?: string | null; phone?: string | null }
): string {
  return template
    .replace(/\{\{name\}\}/gi, customer.name || '')
    .replace(/\{\{email\}\}/gi, customer.email || '')
    .replace(/\{\{phone\}\}/gi, customer.phone || '')
}
