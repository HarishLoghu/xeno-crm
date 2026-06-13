import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/campaigns
 * List all campaigns ordered by createdAt desc.
 */
export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { communications: true },
        },
      },
    })

    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error('[GET /api/campaigns] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/campaigns
 * Create a new campaign.
 *
 * Body: { name, goal, channel, messageTemplate, segmentRule }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, goal, channel, messageTemplate, segmentRule } = body

    // Validate required fields
    const missing: string[] = []
    if (!name) missing.push('name')
    if (!goal) missing.push('goal')
    if (!channel) missing.push('channel')
    if (!messageTemplate) missing.push('messageTemplate')
    if (!segmentRule) missing.push('segmentRule')

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
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

    const campaign = await prisma.campaign.create({
      data: {
        name,
        goal,
        channel,
        messageTemplate,
        segmentRule: typeof segmentRule === 'string' ? JSON.parse(segmentRule) : segmentRule,
      },
    })

    return NextResponse.json({ campaign }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/campaigns] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}
