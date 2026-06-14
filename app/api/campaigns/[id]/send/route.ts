import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const CHANNEL_STUB_URL = process.env.CHANNEL_STUB_URL || 'http://localhost:3001'
export const maxDuration = 60

/**
 * POST /api/campaigns/[id]/send
 * Trigger a campaign send.
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

    // Step 3: Create communication records in bulk to avoid timeout and pool exhaustion
    await prisma.communication.createMany({
      data: eligible.map(customer => ({
        campaignId: campaign.id,
        customerId: customer.id,
        channel: campaign.channel,
        message: personalize(campaign.messageTemplate, customer),
        status: 'queued',
      }))
    })

    // Fetch the newly created records so we have their IDs for the background jobs
    const communications = await prisma.communication.findMany({
      where: {
        campaignId: campaign.id,
        status: 'queued'
      }
    })

    // Update campaign status immediately
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status: 'running',
        totalSent: eligible.length,
      },
    })

    // Return success IMMEDIATELY to prevent Vercel timeout
    const result = {
      sent: eligible.length,
      suppressed: suppressed.length,
      total: allCustomers.length,
    }

    // Step 4: Send to channel stub in chunks of 50 to prevent connection pool exhaustion
    // We MUST await this process. Vercel automatically kills/freezes background tasks 
    // the millisecond a response is returned if experimental background jobs aren't configured.
    const CHUNK_SIZE = 50
    for (let i = 0; i < communications.length; i += CHUNK_SIZE) {
      const chunk = communications.slice(i, i + CHUNK_SIZE)

      const sendPromises = chunk.map(async (comm) => {
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
              crmCallbackUrl: process.env.NEXT_PUBLIC_APP_URL 
                ? `${process.env.NEXT_PUBLIC_APP_URL}/api/receipts` 
                : 'http://localhost:3000/api/receipts',
            }),
            signal: AbortSignal.timeout(5000), // 5 second timeout per fetch
          })

          if (response.ok) {
            const data = await response.json()
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
          // Mark as sent anyway so it doesn't stay queued forever
          await prisma.communication.update({
            where: { id: comm.id },
            data: { status: 'sent', sentAt: new Date() },
          })
        }
      })

      // Wait for the chunk to finish before processing the next 50
      await Promise.allSettled(sendPromises)
    }

    // Return success response only after processing completes
    return NextResponse.json(result)
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

  const isDateField = field.endsWith('At') || field === 'date';
  
  // Safe number parser to avoid passing NaN to Prisma
  const parseNum = (v: any) => {
    const num = Number(v);
    return isNaN(num) ? v : num;
  };

  switch (operator) {
    case 'equals':
      return { [field]: value }
    case 'not_equals':
      return { [field]: { not: value } }
    case 'contains':
      return { [field]: { contains: value, mode: 'insensitive' } }
    case 'gt':
    case 'greater_than':
      return { [field]: { gt: isDateField ? new Date(String(value)) : parseNum(value) } }
    case 'gte':
    case 'greater_than_equals':
      return { [field]: { gte: isDateField ? new Date(String(value)) : parseNum(value) } }
    case 'lt':
    case 'less_than':
      return { [field]: { lt: isDateField ? new Date(String(value)) : parseNum(value) } }
    case 'lte':
    case 'less_than_equals':
      return { [field]: { lte: isDateField ? new Date(String(value)) : parseNum(value) } }
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
