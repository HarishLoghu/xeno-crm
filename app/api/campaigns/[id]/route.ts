import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/campaigns/[id]
 * Get a single campaign with stats and recent communications (last 20).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        communications: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                healthScore: true,
                healthLabel: true,
              },
            },
          },
        },
        _count: {
          select: { communications: true },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Build aggregated stats
    const stats = {
      totalSent: campaign.totalSent,
      totalDelivered: campaign.totalDelivered,
      totalFailed: campaign.totalFailed,
      totalOpened: campaign.totalOpened,
      totalClicked: campaign.totalClicked,
      totalConverted: campaign.totalConverted,
      deliveryRate: campaign.totalSent > 0
        ? Math.round((campaign.totalDelivered / campaign.totalSent) * 10000) / 100
        : 0,
      openRate: campaign.totalDelivered > 0
        ? Math.round((campaign.totalOpened / campaign.totalDelivered) * 10000) / 100
        : 0,
      clickRate: campaign.totalOpened > 0
        ? Math.round((campaign.totalClicked / campaign.totalOpened) * 10000) / 100
        : 0,
      conversionRate: campaign.totalSent > 0
        ? Math.round((campaign.totalConverted / campaign.totalSent) * 10000) / 100
        : 0,
    }

    return NextResponse.json({
      campaign,
      stats,
      recentCommunications: campaign.communications,
    })
  } catch (error) {
    console.error('[GET /api/campaigns/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Delete child communications first to satisfy foreign key constraints
    await prisma.communication.deleteMany({
      where: { campaignId: id },
    })

    // Delete the campaign
    await prisma.campaign.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/campaigns/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    )
  }
}
