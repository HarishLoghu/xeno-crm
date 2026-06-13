import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'

const prisma = new PrismaClient()

// Indian first and last names for realistic data
const INDIAN_FIRST_NAMES = [
  'Aarav', 'Aditi', 'Aisha', 'Ajay', 'Akash', 'Amit', 'Amrita', 'Ananya', 'Anil', 'Anjali',
  'Ankita', 'Arjun', 'Asha', 'Bhavna', 'Chandan', 'Deepa', 'Deepak', 'Devi', 'Dhruv', 'Divya',
  'Gaurav', 'Geeta', 'Hari', 'Harish', 'Indira', 'Ishaan', 'Jaya', 'Kabir', 'Kajal', 'Karan',
  'Kavita', 'Kishore', 'Krishna', 'Lakshmi', 'Manish', 'Meera', 'Mohan', 'Mukesh', 'Nandini', 'Neeraj',
  'Neha', 'Nikhil', 'Nisha', 'Pallavi', 'Pankaj', 'Pooja', 'Pradeep', 'Pranav', 'Priya', 'Rahul',
  'Raj', 'Rajesh', 'Raju', 'Rakesh', 'Rani', 'Ravi', 'Rekha', 'Ritu', 'Rohit', 'Sachin',
  'Sandeep', 'Sanjay', 'Sapna', 'Sarita', 'Seema', 'Shanti', 'Shikha', 'Shivani', 'Shreya', 'Shubham',
  'Sita', 'Sneha', 'Sonal', 'Sunil', 'Sunita', 'Suresh', 'Swati', 'Tanvi', 'Tara', 'Uma',
  'Varun', 'Vijay', 'Vikram', 'Vinay', 'Vinita', 'Vipin', 'Vishal', 'Vivek', 'Yamini', 'Yogesh',
  'Zara', 'Zubin', 'Aditya', 'Bharat', 'Chitra', 'Daksh', 'Esha', 'Farhan', 'Gauri', 'Hemant',
]

const INDIAN_LAST_NAMES = [
  'Agarwal', 'Ahuja', 'Bajaj', 'Banerjee', 'Bhat', 'Bhatt', 'Bose', 'Chakraborty', 'Chand', 'Chatterjee',
  'Chauhan', 'Chopra', 'Das', 'Desai', 'Deshpande', 'Dutta', 'Gandhi', 'Ghosh', 'Goyal', 'Gupta',
  'Iyer', 'Jain', 'Jha', 'Joshi', 'Kapoor', 'Kaur', 'Khan', 'Khanna', 'Kohli', 'Kumar',
  'Lal', 'Mahajan', 'Malhotra', 'Mehra', 'Mehta', 'Menon', 'Mishra', 'Mittal', 'Modi', 'Mukherjee',
  'Nair', 'Nanda', 'Narayan', 'Pandey', 'Patel', 'Patil', 'Pillai', 'Prasad', 'Rai', 'Rajan',
  'Rao', 'Rastogi', 'Reddy', 'Roy', 'Sachdev', 'Saxena', 'Sen', 'Seth', 'Shah', 'Sharma',
  'Shukla', 'Singh', 'Sinha', 'Soni', 'Srivastava', 'Subramanian', 'Tandon', 'Thakur', 'Tiwari', 'Trivedi',
  'Varma', 'Verma', 'Vyas', 'Yadav',
]

const PRODUCT_CATALOG: Record<string, { names: string[]; priceRange: [number, number] }> = {
  fashion: {
    names: [
      'Cotton Kurta Set', 'Silk Saree', 'Denim Jeans', 'Formal Blazer', 'Ethnic Lehenga',
      'Casual T-Shirt Pack', 'Chino Pants', 'Embroidered Dupatta', 'Sports Tracksuit', 'Designer Sherwani',
      'Anarkali Suit', 'Linen Shirt', 'Palazzo Pants', 'Nehru Jacket', 'Banarasi Saree',
    ],
    priceRange: [499, 12999],
  },
  beauty: {
    names: [
      'Kumkumadi Face Oil', 'Charcoal Face Wash', 'Aloe Vera Gel', 'Hair Serum', 'Matte Lipstick Set',
      'BB Cream SPF 30', 'Rose Water Toner', 'Vitamin C Serum', 'Kajal Duo Pack', 'Ubtan Face Pack',
      'Neem Face Mask', 'Argan Oil Shampoo', 'Henna Hair Pack', 'Coconut Body Lotion', 'Nail Art Kit',
    ],
    priceRange: [199, 2999],
  },
  electronics: {
    names: [
      'TWS Earbuds Pro', 'Smart Watch Band', 'Power Bank 20000mAh', 'Bluetooth Speaker',
      'USB-C Hub Adapter', 'Webcam HD 1080p', 'Mechanical Keyboard', 'Wireless Mouse',
      'Phone Case Premium', 'Fast Charger 65W', 'Ring Light 10"', 'Laptop Stand',
      'Smart Plug WiFi', 'Fitness Tracker', 'Portable SSD 500GB',
    ],
    priceRange: [599, 8999],
  },
}

const CATEGORIES = Object.keys(PRODUCT_CATALOG)
const CHANNELS = ['email', 'sms', 'push'] as const

function randomIndianName(): string {
  const first = INDIAN_FIRST_NAMES[Math.floor(Math.random() * INDIAN_FIRST_NAMES.length)]
  const last = INDIAN_LAST_NAMES[Math.floor(Math.random() * INDIAN_LAST_NAMES.length)]
  return `${first} ${last}`
}

function randomIndianPhone(): string {
  // Indian mobile numbers: +91 followed by 10 digits starting with 6-9
  const firstDigit = faker.helpers.arrayElement(['6', '7', '8', '9'])
  const rest = faker.string.numeric(9)
  return `+91${firstDigit}${rest}`
}

function randomEmail(name: string): string {
  const domains = ['gmail.com', 'yahoo.co.in', 'outlook.com', 'hotmail.com', 'rediffmail.com']
  const clean = name.toLowerCase().replace(/\s+/g, '.')
  const suffix = faker.number.int({ min: 1, max: 999 })
  const domain = faker.helpers.arrayElement(domains)
  return `${clean}${suffix}@${domain}`
}

function generateHealthScore(): { score: number; label: string } {
  const roll = Math.random()

  let score: number
  if (roll < 0.60) {
    // 60% Healthy (75-100)
    score = faker.number.float({ min: 75, max: 100, fractionDigits: 1 })
  } else if (roll < 0.85) {
    // 25% At Risk (40-74)
    score = faker.number.float({ min: 40, max: 74, fractionDigits: 1 })
  } else {
    // 15% Burned (0-39)
    score = faker.number.float({ min: 0, max: 39, fractionDigits: 1 })
  }

  let label: string
  if (score >= 75) label = 'Healthy'
  else if (score >= 40) label = 'At Risk'
  else label = 'Burned'

  return { score, label }
}

function generateEngagementProfile(healthScore: number): any {
  const channelCount = faker.number.int({ min: 1, max: 3 })
  const selectedChannels = faker.helpers.arrayElements([...CHANNELS], channelCount)

  const channels: any = {}
  let bestChannel: string | null = null
  let bestOpenRate = -1

  for (const ch of selectedChannels) {
    const sent = faker.number.int({ min: 1, max: 30 })
    const openRate = healthScore >= 75
      ? faker.number.float({ min: 0.3, max: 0.8, fractionDigits: 2 })
      : healthScore >= 40
        ? faker.number.float({ min: 0.1, max: 0.4, fractionDigits: 2 })
        : faker.number.float({ min: 0, max: 0.15, fractionDigits: 2 })

    const opened = Math.round(sent * openRate)
    const clicked = Math.round(opened * faker.number.float({ min: 0.1, max: 0.5, fractionDigits: 2 }))
    const converted = Math.round(clicked * faker.number.float({ min: 0.05, max: 0.3, fractionDigits: 2 }))

    channels[ch] = {
      sent,
      opened,
      clicked,
      converted,
      open_rate: Math.round(openRate * 100) / 100,
    }

    if (openRate > bestOpenRate) {
      bestOpenRate = openRate
      bestChannel = ch
    }
  }

  const consecutiveIgnores = healthScore < 40
    ? faker.number.int({ min: 3, max: 8 })
    : healthScore < 75
      ? faker.number.int({ min: 0, max: 3 })
      : faker.number.int({ min: 0, max: 1 })

  const totalCampaigns = Object.values(channels).reduce(
    (sum: number, ch: any) => sum + (ch.sent || 0),
    0
  )

  const now = new Date()
  const lastEngaged = healthScore >= 40
    ? faker.date.between({
      from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      to: now,
    }).toISOString()
    : healthScore > 10
      ? faker.date.between({
        from: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        to: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      }).toISOString()
      : null

  const lastMessaged = faker.date.between({
    from: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
    to: now,
  }).toISOString()

  return {
    channels,
    best_channel: bestChannel,
    best_hour: faker.number.int({ min: 8, max: 21 }),
    consecutive_ignores: consecutiveIgnores,
    last_engaged_at: lastEngaged,
    last_messaged_at: lastMessaged,
    total_campaigns: totalCampaigns,
  }
}

function generateOrders(customerId: string, count: number): {
  customerId: string
  amount: number
  productName: string
  category: string
  orderedAt: Date
}[] {
  const orders = []
  const now = new Date()
  const eighteenMonthsAgo = new Date(now.getTime() - 18 * 30 * 24 * 60 * 60 * 1000)

  for (let i = 0; i < count; i++) {
    const category = faker.helpers.arrayElement(CATEGORIES)
    const catalog = PRODUCT_CATALOG[category]
    const productName = faker.helpers.arrayElement(catalog.names)
    const amount = faker.number.float({
      min: catalog.priceRange[0],
      max: catalog.priceRange[1],
      fractionDigits: 2,
    })

    orders.push({
      customerId,
      amount,
      productName,
      category,
      orderedAt: faker.date.between({ from: eighteenMonthsAgo, to: now }),
    })
  }

  return orders
}

async function main() {
  console.log('🌱 Seeding database with 500 customers...')

  // Clear existing data
  console.log('  Clearing existing data...')
  await prisma.communication.deleteMany()
  await prisma.campaign.deleteMany()
  await prisma.order.deleteMany()
  await prisma.insightCard.deleteMany()
  await prisma.customer.deleteMany()

  const TOTAL_CUSTOMERS = 500
  const BATCH_SIZE = 50

  let totalOrders = 0

  for (let batch = 0; batch < TOTAL_CUSTOMERS; batch += BATCH_SIZE) {
    const batchEnd = Math.min(batch + BATCH_SIZE, TOTAL_CUSTOMERS)
    const batchCustomers = []

    for (let i = batch; i < batchEnd; i++) {
      const name = randomIndianName()
      const { score, label } = generateHealthScore()
      const profile = generateEngagementProfile(score)

      batchCustomers.push({
        name,
        email: randomEmail(name),
        phone: randomIndianPhone(),
        healthScore: score,
        healthLabel: label,
        engagementProfile: profile,
        createdAt: faker.date.between({
          from: new Date(Date.now() - 18 * 30 * 24 * 60 * 60 * 1000),
          to: new Date(),
        }),
      })
    }

    // Create customers in batch
    await prisma.customer.createMany({ data: batchCustomers })

    // Get created customer IDs
    const createdCustomers = await prisma.customer.findMany({
      where: {
        email: { in: batchCustomers.map((c) => c.email).filter((e): e is string => e !== null) },
      },
      select: { id: true },
    })

    // Generate orders for each customer
    const allOrders = []
    for (const customer of createdCustomers) {
      const orderCount = faker.number.int({ min: 1, max: 12 })
      const orders = generateOrders(customer.id, orderCount)
      allOrders.push(...orders)
    }

    await prisma.order.createMany({ data: allOrders })
    totalOrders += allOrders.length

    console.log(`  Created customers ${batch + 1} - ${batchEnd} with ${allOrders.length} orders`)
  }

  // Print summary
  const customerCount = await prisma.customer.count()
  const orderCount = await prisma.order.count()
  const healthyCount = await prisma.customer.count({ where: { healthLabel: 'Healthy' } })
  const atRiskCount = await prisma.customer.count({ where: { healthLabel: 'At Risk' } })
  const burnedCount = await prisma.customer.count({ where: { healthLabel: 'Burned' } })

  console.log('\n✅ Seed complete!')
  console.log(`   Customers: ${customerCount}`)
  console.log(`   Orders:    ${orderCount}`)
  console.log(`   Health Distribution:`)
  console.log(`     Healthy:  ${healthyCount} (${((healthyCount / customerCount) * 100).toFixed(1)}%)`)
  console.log(`     At Risk:  ${atRiskCount} (${((atRiskCount / customerCount) * 100).toFixed(1)}%)`)
  console.log(`     Burned:   ${burnedCount} (${((burnedCount / customerCount) * 100).toFixed(1)}%)`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
