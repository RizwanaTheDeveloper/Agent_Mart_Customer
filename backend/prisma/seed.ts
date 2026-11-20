import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const emails = [
    'buyer1@agentmart.test',
    'buyer2@agentmart.test',
    'seller1@agentmart.test',
    'seller2@agentmart.test',
    'admin@agentmart.test',
  ];

  for (const email of emails) {
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email },
    });
  }

  console.log(`Seeded ${emails.length} users`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
