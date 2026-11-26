import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL?.trim() || undefined,
  required: process.env.NODE_ENV === 'production' || process.env.DATABASE_REQUIRED === 'true',
}));
