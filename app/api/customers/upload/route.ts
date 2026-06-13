import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * POST /api/customers/upload
 * Bulk-create customers from CSV text.
 *
 * Body: { csv: string }
 *
 * Expected CSV format (first row = headers):
 *   name,email,phone
 *   "Rajesh Kumar",rajesh@example.com,+919876543210
 *   ...
 *
 * Returns: { created: number, errors: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { csv } = body

    if (!csv || typeof csv !== 'string') {
      return NextResponse.json(
        { error: 'CSV text is required in the "csv" field' },
        { status: 400 }
      )
    }

    const lines = csv
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)

    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV must contain a header row and at least one data row' },
        { status: 400 }
      )
    }

    // Parse header
    const headers = parseCsvLine(lines[0]).map((h: string) => h.toLowerCase().trim())
    const nameIdx = headers.indexOf('name')
    const emailIdx = headers.indexOf('email')
    const phoneIdx = headers.indexOf('phone')

    if (nameIdx === -1) {
      return NextResponse.json(
        { error: 'CSV must have a "name" column' },
        { status: 400 }
      )
    }

    const customersData: { name: string; email: string | null; phone: string | null }[] = []
    const errors: string[] = []

    for (let i = 1; i < lines.length; i++) {
      try {
        const fields = parseCsvLine(lines[i])
        const name = fields[nameIdx]?.trim()

        if (!name) {
          errors.push(`Row ${i + 1}: Missing name`)
          continue
        }

        customersData.push({
          name,
          email: emailIdx >= 0 ? fields[emailIdx]?.trim() || null : null,
          phone: phoneIdx >= 0 ? fields[phoneIdx]?.trim() || null : null,
        })
      } catch (err) {
        errors.push(`Row ${i + 1}: Parse error - ${err instanceof Error ? err.message : 'Unknown'}`)
      }
    }

    if (customersData.length === 0) {
      return NextResponse.json(
        { error: 'No valid customer rows found', errors },
        { status: 400 }
      )
    }

    // Batch create
    const result = await prisma.customer.createMany({
      data: customersData,
      skipDuplicates: true,
    })

    return NextResponse.json({
      created: result.count,
      totalRows: lines.length - 1,
      errors: errors.length > 0 ? errors : undefined,
    }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/customers/upload] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process CSV upload' },
      { status: 500 }
    )
  }
}

/**
 * Simple CSV line parser that handles quoted fields.
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++ // skip escaped quote
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        fields.push(current)
        current = ''
      } else {
        current += char
      }
    }
  }

  fields.push(current)
  return fields
}
