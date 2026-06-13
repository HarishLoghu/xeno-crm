export async function GET() {
  const dbUrl = process.env.DATABASE_URL
  const masked = dbUrl 
    ? dbUrl.substring(0, 50) + '...' 
    : 'NOT SET'
  
  try {
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    const count = await prisma.customer.count()
    return Response.json({ 
      dbUrl: masked, 
      customerCount: count,
      status: 'connected' 
    })
  } catch (error: any) {
    return Response.json({ 
      dbUrl: masked, 
      error: error.message,
      status: 'failed' 
    })
  }
}
