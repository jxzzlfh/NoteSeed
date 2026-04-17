import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

vi.mock('../../config/env.js', () => ({
  env: {
    DATABASE_URL: 'postgresql://localhost:5432/noteseed_test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_SECRET: 'test-jwt-secret-0123456789abcdef',
    JWT_ACCESS_EXPIRES: '1h',
    JWT_REFRESH_EXPIRES: '30d',
    CREDENTIAL_ENCRYPTION_KEY: 'dGVzdGtleTEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNA==',
    ANTHROPIC_API_KEY: 'sk-ant-test-key',
    NODE_ENV: 'test',
    PORT: 3999,
    LOG_LEVEL: 'error',
  },
}));

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    userSettings: { findUnique: vi.fn(), upsert: vi.fn() },
    userCredential: { findUnique: vi.fn(), findMany: vi.fn(), upsert: vi.fn() },
    saveLog: { create: vi.fn() },
  },
}));

import { buildApp } from '../../app.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
});

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as { status: string };
    expect(body.status).toBe('ok');
  });
});

describe('POST /api/v1/cards/generate', () => {
  it('returns 401 without auth', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/cards/generate',
      payload: { source: {} },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /api/v1/cards/save', () => {
  it('returns 401 without auth', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/cards/save',
      payload: {},
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/v1/settings', () => {
  it('returns 401 without auth', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/settings',
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('PUT /api/v1/credentials', () => {
  it('returns 401 without auth', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/credentials',
      payload: { target: 'memos', data: {} },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('returns 200 for valid email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'test@example.com' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('returns 400 for invalid email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'not-an-email' },
    });
    expect(res.statusCode).toBe(400);
  });
});
