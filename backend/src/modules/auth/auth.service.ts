import { ConflictException, ForbiddenException, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AccountRole, Prisma } from '@prisma/client';
import { hash, verify, Algorithm } from '@node-rs/argon2';
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthPrincipal, AuthTokens, PublicUser } from '../../common/interfaces/auth.interface.js';
import type { RegisterDto, LoginDto } from './dto/auth.dto.js';
import { refreshPattern, uuidPattern } from '../../common/constants/auth.constants.js';

const publicUser = { id: true, email: true, name: true, role: true } as const;
const passwordOptions = { algorithm: Algorithm.Argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1, outputLen: 32 };
export const issuer = 'agentmart-api';
export const audience = 'agentmart-clients';

export function durationSeconds(value: string): number {
  const match = /^([1-9]\d*)(s|m|h|d)$/.exec(value);
  if (!match) throw Error('Invalid authentication token duration.');
  const units: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  const seconds = Number(match[1]) * units[match[2]];
  if (!Number.isSafeInteger(seconds)) throw Error('Authentication token duration is too large.');
  return seconds;
}

@Injectable()
export class AuthService {
  private readonly dummyHash = hash(randomBytes(32), passwordOptions);

  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService, private readonly jwt: JwtService) {}

  private database() {
    if (!this.prisma.configured) throw new ServiceUnavailableException('Authentication database is not configured.');
    return this.prisma;
  }

  private refreshHash(token: string): string {
    return createHmac('sha256', this.config.getOrThrow<string>('auth.refreshSecret')).update(token).digest('hex');
  }

  private newSession(userId: string) {
    const id = randomUUID();
    const token = `${id}.${randomBytes(32).toString('base64url')}`;
    const seconds = durationSeconds(this.config.getOrThrow<string>('auth.refreshExpiration'));
    return { token, record: { id, userId, tokenHash: this.refreshHash(token), expiresAt: new Date(Date.now() + seconds * 1000) } };
  }

  private async issue(user: PublicUser, sessionId: string, refreshToken: string, refreshExpiry: Date): Promise<AuthTokens> {
    const seconds = durationSeconds(this.config.getOrThrow<string>('auth.accessExpiration'));
    const accessToken = await this.jwt.signAsync({ sub: user.id, sid: sessionId, type: 'access' }, {
      secret: this.config.getOrThrow<string>('auth.accessSecret'), algorithm: 'HS256', issuer, audience, expiresIn: seconds,
    });
    return { accessToken, refreshToken, expiresAt: Date.now() + seconds * 1000, refreshExpiresAt: refreshExpiry.getTime(), user };
  }

  async register(input: RegisterDto): Promise<AuthTokens> {
    const db = this.database();
    const passwordHash = await hash(input.password, passwordOptions);
    try {
      const result = await db.$transaction(async tx => {
        const user = await tx.user.create({ data: { email: input.email.trim().toLowerCase(), name: input.name.trim(), passwordHash, role: input.role || AccountRole.BUYER }, select: publicUser });
        const session = this.newSession(user.id);
        await tx.refreshSession.create({ data: session.record });
        return { user, session };
      });
      return this.issue(result.user, result.session.record.id, result.session.token, result.session.record.expiresAt);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('An account with this email already exists.');
      throw error;
    }
  }

  async login(input: LoginDto): Promise<AuthTokens> {
    const db = this.database();
    const user = await db.user.findUnique({ where: { email: input.email.trim().toLowerCase() } });
    let valid = false;
    try { valid = await verify(user?.passwordHash || await this.dummyHash, input.password); } catch { /* Malformed stored hashes cannot authenticate. */ }
    if (!user || !valid) throw new UnauthorizedException('Email or password is incorrect.');
    if (input.role && user.role !== input.role) {
      throw new ForbiddenException(`This is a ${user.role === AccountRole.BUYER ? 'Buyer' : 'Seller'} account. Use ${user.role === AccountRole.BUYER ? 'Buyer' : 'Seller'} login.`);
    }
    const session = this.newSession(user.id);
    await db.refreshSession.create({ data: session.record });
    return this.issue({ id: user.id, email: user.email, name: user.name, role: user.role }, session.record.id, session.token, session.record.expiresAt);
  }

  async refresh(token: string | undefined): Promise<AuthTokens> {
    if (!token || !refreshPattern.test(token)) throw new UnauthorizedException('Sign in again to continue.');
    const db = this.database();
    const id = token.split('.')[0];
    const session = await db.refreshSession.findUnique({ where: { id }, include: { user: { select: publicUser } } });
    const candidate = Buffer.from(this.refreshHash(token), 'hex');
    const stored = Buffer.from(session?.tokenHash || '0'.repeat(64), 'hex');
    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now() || candidate.length !== stored.length || !timingSafeEqual(candidate, stored)) {
      throw new UnauthorizedException('Sign in again to continue.');
    }
    const next = `${id}.${randomBytes(32).toString('base64url')}`;
    const updated = await db.refreshSession.updateMany({ where: { id, tokenHash: session.tokenHash, revokedAt: null, expiresAt: { gt: new Date() } }, data: { tokenHash: this.refreshHash(next) } });
    if (updated.count !== 1) throw new UnauthorizedException('This refresh token has already been used.');
    return this.issue(session.user, id, next, session.expiresAt);
  }

  async validateAccess(payload: Record<string, unknown>): Promise<AuthPrincipal> {
    if (payload.type !== 'access' || typeof payload.sub !== 'string' || typeof payload.sid !== 'string' || !uuidPattern.test(payload.sub) || !uuidPattern.test(payload.sid)) throw new UnauthorizedException();
    const session = await this.database().refreshSession.findFirst({ where: { id: payload.sid, userId: payload.sub, revokedAt: null, expiresAt: { gt: new Date() } }, include: { user: { select: publicUser } } });
    if (!session) throw new UnauthorizedException('Your session has expired. Sign in again.');
    return { user: session.user, sessionId: session.id };
  }

  async logout(principal: AuthPrincipal): Promise<void> {
    await this.database().refreshSession.updateMany({ where: { id: principal.sessionId, userId: principal.user.id, revokedAt: null }, data: { revokedAt: new Date() } });
  }
}
