import type { FastifyRequest, FastifyReply } from 'fastify';

/**
 * preHandler hook: verifies JWT Bearer token.
 * Attach to protected routes.
 */
export async function authGuard(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    return reply.status(401).send({ error: 'Unauthorized', code: 401 });
  }
}
