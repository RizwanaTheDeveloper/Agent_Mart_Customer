import { Controller, Get, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOkResponse, ApiOperation, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Check that the API process is running' })
  @ApiOkResponse({ description: 'API process is alive. This does not assert database readiness.' })
  live() {
    return { status: 'ok', service: this.config.get<string>('app.name'), timestamp: new Date().toISOString() };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Check PostgreSQL connectivity' })
  @ApiOkResponse({ description: 'PostgreSQL responds to SELECT 1.' })
  @ApiServiceUnavailableResponse({ description: 'Database is unconfigured or unavailable.' })
  async ready(@Res({ passthrough: true }) response: Response) {
    const connected = await this.prisma.isHealthy();
    if (!connected) response.status(503);
    return { status: connected ? 'ok' : 'not_ready', database: !this.prisma.configured ? 'unconfigured' : connected ? 'connected' : 'unavailable', timestamp: new Date().toISOString() };
  }
}
