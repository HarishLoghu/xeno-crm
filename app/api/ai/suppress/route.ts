import { NextRequest, NextResponse } from 'next/server'
import { askGemini } from '@/lib/gemini'

interface CustomerForSuppression {
  id: string
  name: string
  healthScore: number
  messagesSentLast7Days: number
}

/**
 * POST /api/ai/suppress
 * Rule-based suppression with AI explanation.
 *
 * Body: { customers: [{ id, name, healthScore, messagesSentLast7Days }] }
 *
 * Rules:
 * - healthScore < 40 → suppress (Burned)
 * - messagesSentLast7Days >= 3 → suppress (Over-messaged)
 *
 * Returns: { suppressedIds, explanation }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customers } = body

    if (!customers || !Array.isArray(customers)) {
      return NextResponse.json(
        { error: 'customers array is required' },
        { status: 400 }
      )
    }

    // Rule-based filtering
    const suppressed: CustomerForSuppression[] = []
    const eligible: CustomerForSuppression[] = []

    const burnedNames: string[] = []
    const overMessagedNames: string[] = []

    for (const customer of customers as CustomerForSuppression[]) {
      const isBurned = customer.healthScore < 40
      const isOverMessaged = customer.messagesSentLast7Days >= 3

      if (isBurned || isOverMessaged) {
        suppressed.push(customer)
        if (isBurned) burnedNames.push(customer.name)
        if (isOverMessaged) overMessagedNames.push(customer.name)
      } else {
        eligible.push(customer)
      }
    }

    const suppressedIds = suppressed.map((c) => c.id)

    // Generate AI explanation
    let explanation: string

    if (suppressed.length === 0) {
      explanation = 'All customers are eligible for messaging. No suppression needed.'
    } else {
      try {
        explanation = await askGemini(
          `You are a CRM engagement advisor. Explain in 2-3 plain English sentences why certain customers were suppressed from a campaign. Be specific about the reasons and mention counts. Keep it concise and professional.`,
          `Total customers evaluated: ${customers.length}
Suppressed: ${suppressed.length}
Eligible: ${eligible.length}
Burned customers (health score < 40): ${burnedNames.length} ${burnedNames.length > 0 ? `— including ${burnedNames.slice(0, 3).join(', ')}${burnedNames.length > 3 ? ` and ${burnedNames.length - 3} more` : ''}` : ''}
Over-messaged customers (3+ messages in 7 days): ${overMessagedNames.length} ${overMessagedNames.length > 0 ? `— including ${overMessagedNames.slice(0, 3).join(', ')}${overMessagedNames.length > 3 ? ` and ${overMessagedNames.length - 3} more` : ''}` : ''}`
        )
      } catch {
        // Fallback to rule-based explanation
        const reasons: string[] = []
        if (burnedNames.length > 0) {
          reasons.push(
            `${burnedNames.length} customer${burnedNames.length > 1 ? 's were' : ' was'} suppressed due to low health scores (below 40), indicating disengagement or negative sentiment`
          )
        }
        if (overMessagedNames.length > 0) {
          reasons.push(
            `${overMessagedNames.length} customer${overMessagedNames.length > 1 ? 's were' : ' was'} suppressed because they received 3 or more messages in the past 7 days`
          )
        }
        explanation = `${suppressed.length} out of ${customers.length} customers were suppressed. ${reasons.join('. ')}.`
      }
    }

    return NextResponse.json({
      suppressedIds,
      explanation,
      summary: {
        total: customers.length,
        suppressed: suppressed.length,
        eligible: eligible.length,
        burnedCount: burnedNames.length,
        overMessagedCount: overMessagedNames.length,
      },
    })
  } catch (error) {
    console.error('[POST /api/ai/suppress] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process suppression check' },
      { status: 500 }
    )
  }
}
