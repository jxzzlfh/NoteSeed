import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import { authGuard } from '../plugins/auth-guard.js';

const UpsertCredentialBody = z.object({
  target: z.string().min(1),
  data: z.record(z.unknown()),
});

export async function credentialsRoutes(app: FastifyInstance) {
  app.put(
    '/api/v1/credentials',
    { preHandler: [authGuard] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = UpsertCredentialBody.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Invalid body', details: parsed.error.issues });
      }

      const { target, data } = parsed.data;
      const { userId } = request.user;
      const encrypted = encrypt(JSON.stringify(data));

      await prisma.userCredential.upsert({
        where: { userId_target: { userId, target } },
        create: { userId, target, encryptedData: encrypted },
        update: { encryptedData: encrypted },
      });

      return reply.send({ ok: true, target });
    },
  );

  app.get(
    '/api/v1/credentials',
    { preHandler: [authGuard] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId } = request.user;
      const creds = await prisma.userCredential.findMany({
        where: { userId },
        select: { target: true, updatedAt: true },
      });
      return reply.send({ credentials: creds });
    },
  );

  app.get(
    '/api/v1/credentials/:target',
    { preHandler: [authGuard] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId } = request.user;
      const { target } = request.params as { target: string };
      const cred = await prisma.userCredential.findUnique({
        where: { userId_target: { userId, target } },
      });
      if (!cred) {
        return reply.status(404).send({ error: 'Credential not found' });
      }
      try {
        const data = JSON.parse(decrypt(cred.encryptedData)) as unknown;
        return reply.send({ target, data });
      } catch {
        return reply.status(500).send({ error: 'Failed to decrypt credential' });
      }
    },
  );

  /**
   * POST /api/v1/credentials/test
   * Server-side proxy test — avoids browser CORS restrictions.
   * Body: { target: 'memos', data: { baseUrl, token } }
   */
  const TestBody = z.object({
    target: z.literal('memos'),
    data: z.object({
      baseUrl: z.string().url().min(1),
      token: z.string().min(1),
    }),
  });

  app.post(
    '/api/v1/credentials/test',
    { preHandler: [authGuard] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = TestBody.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .status(400)
          .send({ ok: false, error: 'Invalid body', details: parsed.error.issues });
      }

      const { baseUrl, token } = parsed.data.data;
      const root = baseUrl.replace(/\/+$/, '');
      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      };

      // Memos probe endpoints (try in order, stop on first decisive result):
      //   GET  /api/v1/auth/me      — latest Memos (GetCurrentUser)
      //   POST /api/v1/auth/status   — older Memos v0.22+
      const candidates: Array<{ path: string; method: string }> = [
        { path: '/api/v1/auth/me', method: 'GET' },
        { path: '/api/v1/auth/status', method: 'POST' },
      ];

      for (const { path, method } of candidates) {
        try {
          const res = await fetch(`${root}${path}`, { method, headers });
          if (res.ok) {
            const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
            // /api/v1/auth/me wraps user in { user: { ... } }
            const user = (typeof body.user === 'object' && body.user !== null
              ? body.user
              : body) as Record<string, unknown>;
            const username = (user.username ?? user.displayName ?? user.nickname ?? user.name) as
              | string
              | undefined;
            return reply.send({
              ok: true,
              endpoint: path,
              user: username ?? null,
            });
          }
          if (res.status === 401 || res.status === 403) {
            return reply.send({
              ok: false,
              endpoint: path,
              status: res.status,
              error: 'Token 无效或已过期',
            });
          }
          // 404 / 405 — try next candidate
        } catch (err) {
          return reply.send({
            ok: false,
            endpoint: path,
            error: `无法访问 ${root}：${err instanceof Error ? err.message : String(err)}`,
          });
        }
      }

      return reply.send({
        ok: false,
        error:
          '所有探测端点均不可用，请确认 Base URL 指向的是 Memos 实例（v0.22+）',
      });
    },
  );
}
