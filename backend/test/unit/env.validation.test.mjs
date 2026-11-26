import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateEnvironment as validate } from '../../dist/config/env.validation.js';
const validateEnvironment = input => validate({ JWT_ACCESS_SECRET: 'a'.repeat(48), JWT_REFRESH_SECRET: 'b'.repeat(48), ...input });

test('development boots without inventing a database connection', () => {
  const config = validateEnvironment({});
  assert.equal(config.PORT, 4000);
  assert.equal(config.HOST, '0.0.0.0');
  assert.equal(config.DATABASE_URL, undefined);
  assert.equal(config.DATABASE_REQUIRED, false);
  assert.equal(config.SWAGGER_ENABLED, true);
});

test('invalid ports, prefixes and flags fail before the server listens', () => {
  for (const PORT of ['abc', '0', '-1', '65536', '3.5']) assert.throws(() => validateEnvironment({ PORT }), /PORT/);
  assert.throws(() => validateEnvironment({ API_PREFIX: '/api/v1' }), /API_PREFIX/);
  assert.throws(() => validateEnvironment({ DATABASE_REQUIRED: 'sometimes' }), /DATABASE_REQUIRED/);
  assert.throws(() => validateEnvironment({ SWAGGER_ENABLED: 'yes' }), /SWAGGER_ENABLED/);
});

test('production and explicitly required databases cannot start unconfigured', () => {
  assert.throws(() => validateEnvironment({ NODE_ENV: 'production' }), /DATABASE_URL/);
  assert.throws(() => validateEnvironment({ DATABASE_REQUIRED: 'true' }), /DATABASE_URL/);
  assert.throws(() => validateEnvironment({ DATABASE_URL: 'sqlite:///local.db' }), /PostgreSQL/);
  assert.throws(() => validateEnvironment({ DATABASE_URL: 'postgresql://localhost' }), /PostgreSQL/);
  const config = validateEnvironment({ NODE_ENV: 'production', DATABASE_URL: 'postgresql://localhost/agentmart' });
  assert.equal(config.SWAGGER_ENABLED, false);
  assert.equal(config.DATABASE_REQUIRED, true);
});

test('CORS accepts exact origins and rejects wildcards, paths and insecure production origins', () => {
  assert.throws(() => validateEnvironment({ CORS_ORIGINS: '*' }), /CORS_ORIGINS/);
  assert.throws(() => validateEnvironment({ CORS_ORIGINS: 'http://localhost:8083/path' }), /CORS_ORIGINS/);
  assert.throws(() => validateEnvironment({ NODE_ENV: 'production', DATABASE_URL: 'postgresql://localhost/agentmart', CORS_ORIGINS: 'http://example.com' }), /HTTPS/);
  assert.equal(validateEnvironment({ CORS_ORIGINS: 'https://app.example.com,http://localhost:8083' }).CORS_ORIGINS, 'https://app.example.com,http://localhost:8083');
});

test('JWT settings reject weak or reused secrets without exposing their values', () => {
  assert.throws(() => validateEnvironment({ JWT_ACCESS_SECRET: 'short', JWT_REFRESH_SECRET: 'different' }), /32 characters/);
  assert.throws(() => validateEnvironment({ JWT_ACCESS_SECRET: 'a'.repeat(32), JWT_REFRESH_SECRET: 'a'.repeat(32) }), /distinct/);
  assert.throws(() => validateEnvironment({ JWT_ACCESS_EXPIRATION: 'forever' }), /duration/);
  assert.equal(validateEnvironment({ JWT_ACCESS_SECRET: 'a'.repeat(32), JWT_REFRESH_SECRET: 'b'.repeat(32) }).JWT_ACCESS_SECRET.length, 32);
});

test('storage settings reject unsupported providers and unbounded file sizes', () => {
  assert.throws(() => validateEnvironment({ STORAGE_PROVIDER: 'unknown' }), /STORAGE_PROVIDER/);
  assert.throws(() => validateEnvironment({ MAX_UPLOAD_BYTES: 999999999 }), /MAX_UPLOAD_BYTES/);
});
