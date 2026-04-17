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
}
