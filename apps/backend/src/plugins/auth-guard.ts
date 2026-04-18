import type { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';

const LOCAL_USER_EMAIL = 'local@noteseed.local';
let cachedLocalUserId: string | null = null;

async function ensureLocalUser(): Promise<string> {
  if (cachedLocalUserId) return cachedLocalUserId;
  const user = await prisma.user.upsert({
    where: { email: LOCAL_USER_EMAIL },
    update: {},
    create: {
      email: LOCAL_USER_EMAIL,
      settings: { create: {} },
    },
  });
  cachedLocalUserId = user.id;
  return user.id;
}

/**
 * preHandler hook — single-user local mode.
 * Always injects the built-in local user; no JWT required.
 */
export async function authGuard(request: FastifyRequest, _reply: FastifyReply) {
  const userId = await ensureLocalUser();
  (request as unknown as { user: { userId: string; email: string } }).user = {
    userId,
    email: LOCAL_USER_EMAIL,
  };
}
