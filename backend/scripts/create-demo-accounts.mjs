import { PrismaClient } from '@prisma/client';
import { Algorithm, hash, verify } from '@node-rs/argon2';
import { randomBytes } from 'node:crypto';
import { appendFileSync } from 'node:fs';

const database = new URL(process.env.DATABASE_URL || 'postgresql://unconfigured');
if (process.env.NODE_ENV === 'production' || !['localhost', '127.0.0.1', '[::1]'].includes(database.hostname)) {
  throw new Error('Demo accounts require a configured local development database.');
}

const prisma = new PrismaClient();
try {
  for (const role of ['BUYER', 'SELLER']) {
    const email = `${role.toLowerCase()}@agentmart.test`;
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      console.log(`${email} already exists. Its password and role were preserved.`);
      continue;
    }
    const password = randomBytes(18).toString('base64url');
    const passwordHash = await hash(password, { algorithm: Algorithm.Argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1, outputLen: 32 });
    await prisma.user.create({ data: { email, name: `${role === 'BUYER' ? 'Buyer' : 'Seller'} Test Account`, role, passwordHash } });
    const saved = await prisma.user.findUniqueOrThrow({ where: { email } });
    if (saved.role !== role || !await verify(saved.passwordHash, password)) throw new Error(`Account verification failed for ${email}.`);
    appendFileSync(new URL('../.env.demo-accounts', import.meta.url), `\n# Local ${role} login\n${role}_EMAIL=${email}\n${role}_PASSWORD=${password}\n`, { mode: 0o600 });
    console.log(`Created and verified ${role}: ${email}`);
  }
  console.log('New credentials are saved in backend/.env.demo-accounts (ignored by Git).');
} finally {
  await prisma.$disconnect();
}
