import { ForbiddenException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import type { Request } from 'express';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';

export async function createApplication() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  const config = app.get(ConfigService);
  const prefix = config.getOrThrow<string>('app.prefix');
  app.disable('x-powered-by');
  app.set('trust proxy', false);
  const swagger = config.getOrThrow<boolean>('app.swaggerEnabled');
  app.use(helmet({ contentSecurityPolicy: swagger ? false : undefined }));
  app.use(json({ limit: '64kb' }), urlencoded({ extended: false, limit: '64kb' }));
  app.use(cookieParser());
  app.setGlobalPrefix(prefix);
  const origins = new Set(config.getOrThrow<string[]>('app.corsOrigins'));
  app.enableCors((request: Request, callback) => {
    const origin = request.get('origin');
    const ownOrigin = `${request.protocol}://${request.get('host')}`;
    if (!origin || origins.has(origin) || origin === ownOrigin) callback(null, { credentials: true, origin: origin || false });
    else callback(new ForbiddenException('Origin is not allowed.'), { origin: false });
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();
  if (swagger) {
    const description = new DocumentBuilder().setTitle('AgentMart Nest API').setDescription('PostgreSQL account authentication and health checks. Existing property workspace APIs remain on the current host until migrated.').setVersion('1.0.0').addBearerAuth().build();
    SwaggerModule.setup(`${prefix}/docs`, app, SwaggerModule.createDocument(app, description));
  }
  return app;
}
