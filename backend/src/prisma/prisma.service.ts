import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  readonly configured: boolean;
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService) {
    const url = config.get<string>('database.url');
    super(url ? { datasources: { db: { url } } } : {});
    this.configured = Boolean(url);
  }

  async onModuleInit(): Promise<void> {
    if (this.configured) await this.$connect();
    else this.logger.warn('DATABASE_URL is unset. Liveness is available; database readiness will return HTTP 503.');
  }

  async onModuleDestroy(): Promise<void> { await this.$disconnect(); }

  async isHealthy(): Promise<boolean> {
    if (!this.configured) return false;
    try { await this.$queryRaw`SELECT 1`; return true; }
    catch { return false; }
  }
}
