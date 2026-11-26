import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createApplication } from './bootstrap.js';

async function bootstrap(): Promise<void> {
  const app = await createApplication();
  const config = app.get(ConfigService);
  const host = config.getOrThrow<string>('app.host');
  const port = config.getOrThrow<number>('app.port');
  await app.listen(port, host);
  Logger.log(`AgentMart API listening on ${host}:${port}/${config.getOrThrow<string>('app.prefix')}`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  Logger.error(error instanceof Error ? error.message : 'Application startup failed.', undefined, 'Bootstrap');
  process.exitCode = 1;
});
