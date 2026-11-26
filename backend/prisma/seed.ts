import { PrismaClient } from '@prisma/client';
import { seedPropertyTypes } from './seeds/property-types.seed.ts';

if (!process.env.DATABASE_URL?.trim()) throw new Error('Set DATABASE_URL before running the PostgreSQL seed.');
const prisma = new PrismaClient();
try {
  await seedPropertyTypes(prisma);
  console.log('Property reference types seeded. No users, passwords or business records were created.');
} finally { await prisma.$disconnect(); }
