import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { askGemini } from '@/lib/gemini'

/**
 * POST /api/ai/segment
 * Convert natural language to segment filter JSON using Gemini.
 *
 * Body: { query: string }
 * Returns: { filters, explanation, suggestedChannel, customerCount }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'query is required' },
        { status: 400 }
      )
    }

    let parsed: {
      filters: Record<string, unknown>
      explanation: string
      suggestedChannel: string
    }

    try {
      // Ask Gemini to convert natural language to filter JSON
      const aiResponse = await askGemini(
        `You are a CRM segment builder. Convert natural language queries into structured filter JSON for a customer database.

Available fields:
- healthScore (Float, 0-100)
- healthLabel (String: "Healthy", "At Risk", "Burned")
- name (String)
- email (String)
- createdAt (DateTime) (If using createdAt, always provide value as an ISO-8601 date string, e.g. "2024-01-01T00:00:00Z". For "60 days", calculate the date relative to now)

Available operators: equals, not_equals, contains, gt, gte, lt, lte, in, not_in

Output format (JSON only, no markdown):
{
  "filters": {
    "logic": "AND",
    "rules": [
      { "field": "fieldName", "operator": "operatorName", "value": "value" }
    ]
  },
  "explanation": "Plain English explanation of what this filter does",
  "suggestedChannel": "email" | "sms" | "push"
}

Important: Return ONLY valid JSON, no code blocks or extra text.`,
        query
      )

      // Strip markdown code blocks if Gemini wraps the response
      const cleaned = aiResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      parsed = JSON.parse(cleaned)
    } catch (err: any) {
      console.warn('AI failed, using fallback segment:', err.message)
      parsed = {
        filters: { logic: "AND", rules: [] },
        explanation: "Fallback segment (AI generation failed). Targeting all customers.",
        suggestedChannel: "email"
      }
    }

    // Query DB for matching customer count
    const whereClause = buildWhereFromFilters(parsed.filters)
    const customerCount = await prisma.customer.count({ where: whereClause })

    return NextResponse.json({
      filters: parsed.filters,
      explanation: parsed.explanation,
      suggestedChannel: parsed.suggestedChannel || 'email',
      customerCount,
    })
  } catch (error) {
    console.error('[POST /api/ai/segment] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate segment' },
      { status: 500 }
    )
  }
}

/**
 * Convert filter JSON to Prisma where clause.
 */
function buildWhereFromFilters(
  filters: Record<string, unknown>
): Record<string, unknown> {
  if (!filters) return {}

  if (filters.rules && Array.isArray(filters.rules)) {
    const logic = ((filters.logic as string) || 'AND').toUpperCase()
    const clauses = (filters.rules as Record<string, unknown>[]).map(buildWhereFromFilters)

    if (logic === 'OR') {
      return { OR: clauses }
    }
    return { AND: clauses }
  }

  const field = filters.field as string
  const operator = filters.operator as string
  const value = filters.value

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
      return { [field]: { gt: field === 'createdAt' ? new Date(String(value)) : Number(value) } }
    case 'gte':
    case 'greater_than_equals':
      return { [field]: { gte: field === 'createdAt' ? new Date(String(value)) : Number(value) } }
    case 'lt':
    case 'less_than':
      return { [field]: { lt: field === 'createdAt' ? new Date(String(value)) : Number(value) } }
    case 'lte':
    case 'less_than_equals':
      return { [field]: { lte: field === 'createdAt' ? new Date(String(value)) : Number(value) } }
    case 'in':
      return { [field]: { in: Array.isArray(value) ? value : [value] } }
    case 'not_in':
      return { [field]: { notIn: Array.isArray(value) ? value : [value] } }
    default:
      return { [field]: value }
  }
}
