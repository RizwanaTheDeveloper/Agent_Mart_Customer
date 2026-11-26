import type { PrismaClient } from '@prisma/client';

export async function seedPropertyTypes(prisma: PrismaClient): Promise<void> {
  const types = [
    { code: 'plot', name: 'Plot' },
    { code: 'apartment', name: 'Apartment' },
    { code: 'house', name: 'House' },
    { code: 'commercial', name: 'Commercial' },
    { code: 'farm-land', name: 'Farm land' },
  ];
  await prisma.$transaction(types.map(type => prisma.propertyType.upsert({ where: { code: type.code }, create: type, update: { name: type.name } })));
}
