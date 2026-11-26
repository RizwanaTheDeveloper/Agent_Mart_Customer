export interface Environment {
  [key: string]: unknown;
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  HOST: string;
  API_PREFIX: string;
  DATABASE_URL?: string;
  DATABASE_REQUIRED: boolean;
  CORS_ORIGINS: string;
  SWAGGER_ENABLED: boolean;
}

function optionalString(value: unknown, name: string): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') throw new Error(`${name} must be a string.`);
  return value.trim() || undefined;
}

function boolean(value: unknown, name: string, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  throw new Error(`${name} must be true or false.`);
}

export function validateEnvironment(input: Record<string, unknown>): Environment {
  const environment = optionalString(input.NODE_ENV, 'NODE_ENV') || 'development';
  if (!['development', 'test', 'production'].includes(environment)) {
    throw new Error('NODE_ENV must be development, test or production.');
  }
  const port = Number(input.PORT ?? 4000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535.');
  const prefix = optionalString(input.API_PREFIX, 'API_PREFIX') || 'api/v1';
  if (!/^[a-zA-Z0-9]+(?:\/[a-zA-Z0-9-]+)*$/.test(prefix)) throw new Error('API_PREFIX must be a relative API path.');
  const url = optionalString(input.DATABASE_URL, 'DATABASE_URL');
  const required = environment === 'production' || boolean(input.DATABASE_REQUIRED, 'DATABASE_REQUIRED', false);
  if (required && !url) throw new Error('DATABASE_URL is required in this environment.');
  if (url) {
    try {
      const parsed = new URL(url);
      if (!['postgres:', 'postgresql:'].includes(parsed.protocol) || !parsed.hostname || parsed.pathname.length < 2) throw new Error();
    } catch { throw new Error('DATABASE_URL must be a PostgreSQL connection URL.'); }
  }
  const defaultOrigins = 'http://localhost:8081,http://localhost:8083,http://127.0.0.1:8081,http://127.0.0.1:8083';
  const origins = optionalString(input.CORS_ORIGINS, 'CORS_ORIGINS') || (environment === 'production' ? '' : defaultOrigins);
  for (const origin of origins.split(',').map(value => value.trim()).filter(Boolean)) {
    try {
      const parsed = new URL(origin);
      if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin || (environment === 'production' && parsed.protocol !== 'https:')) throw new Error();
    } catch { throw new Error('CORS_ORIGINS must contain exact HTTP(S) origins; production origins require HTTPS.'); }
  }
  const accessSecret = optionalString(input.JWT_ACCESS_SECRET, 'JWT_ACCESS_SECRET');
  const refreshSecret = optionalString(input.JWT_REFRESH_SECRET, 'JWT_REFRESH_SECRET');
  {
    if (!accessSecret || !refreshSecret || accessSecret.length < 32 || refreshSecret.length < 32 || accessSecret === refreshSecret) {
      throw new Error('JWT secrets must be distinct and each contain at least 32 characters.');
    }
  }
  for (const key of ['JWT_ACCESS_EXPIRATION', 'JWT_REFRESH_EXPIRATION']) {
    const duration = optionalString(input[key], key);
    if (duration && !/^[1-9]\d*(s|m|h|d)$/.test(duration)) throw new Error(`${key} must be a positive duration such as 15m or 7d.`);
  }
  const provider = optionalString(input.STORAGE_PROVIDER, 'STORAGE_PROVIDER') || 'local';
  if (!['local', 's3'].includes(provider)) throw new Error('STORAGE_PROVIDER must be local or s3.');
  const maxUpload = Number(input.MAX_UPLOAD_BYTES ?? 5242880);
  if (!Number.isInteger(maxUpload) || maxUpload < 1 || maxUpload > 20971520) throw new Error('MAX_UPLOAD_BYTES must be between 1 and 20971520.');
  const host = optionalString(input.HOST, 'HOST') || '0.0.0.0';
  return {
    ...input,
    NODE_ENV: environment as Environment['NODE_ENV'], PORT: port, HOST: host, API_PREFIX: prefix,
    DATABASE_URL: url, DATABASE_REQUIRED: required, CORS_ORIGINS: origins,
    JWT_ACCESS_SECRET: accessSecret, JWT_REFRESH_SECRET: refreshSecret,
    STORAGE_PROVIDER: provider, MAX_UPLOAD_BYTES: maxUpload,
    SWAGGER_ENABLED: boolean(input.SWAGGER_ENABLED, 'SWAGGER_ENABLED', environment !== 'production'),
  };
}
