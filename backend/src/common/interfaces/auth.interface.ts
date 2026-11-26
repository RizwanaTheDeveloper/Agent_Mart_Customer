import type { AccountRole } from '@prisma/client';
import type { Request } from 'express';

export type PublicUser = { id: string; email: string; name: string; role: AccountRole };
export type AuthPrincipal = { user: PublicUser; sessionId: string };
export type AuthenticatedRequest = Request & { user: AuthPrincipal };
export type AuthTokens = { accessToken: string; refreshToken: string; expiresAt: number; refreshExpiresAt: number; user: PublicUser };
