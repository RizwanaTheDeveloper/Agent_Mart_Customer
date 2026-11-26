import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  name: process.env.APP_NAME || 'AgentMart API',
  environment: process.env.NODE_ENV || 'development',
  host: process.env.HOST || '0.0.0.0',
  port: Number(process.env.PORT || 4000),
  prefix: process.env.API_PREFIX || 'api/v1',
  corsOrigins: (process.env.CORS_ORIGINS || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8081,http://localhost:8083,http://127.0.0.1:8081,http://127.0.0.1:8083')).split(',').map(value => value.trim()).filter(Boolean),
  swaggerEnabled: process.env.SWAGGER_ENABLED === undefined ? process.env.NODE_ENV !== 'production' : process.env.SWAGGER_ENABLED === 'true',
}));
