import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.campaign.deleteMany({
    where: {
      status: 'draft',
      totalSent: 0
    }
  });
  console.log('Deleted', result.count, 'campaigns.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
