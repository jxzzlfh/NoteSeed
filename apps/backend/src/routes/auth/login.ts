import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import { prisma } from '../../lib/prisma.js';

const loginBodySchema = z.object({
  email: z.string().email(),
});

const verifyBodySchema = z.object({
  token: z.string().min(1),
  email: z.string().email(),
});

/**
 * Magic link tokens stored in-memory for MVP.
 * In production, use Redis with TTL.
 */
const magicTokens = new Map<string, { email: string; expiresAt: number }>();

export async function authRoutes(app: FastifyInstance) {
  /**
   * POST /api/v1/auth/login
   * MVP: prints magic link to console instead of sending email.
   */
  app.post('/api/v1/auth/login', async (request, reply) => {
    const body = loginBodySchema.parse(request.body);
    const token = randomBytes(32).toString('hex');

    magicTokens.set(token, {
      email: body.email,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    app.log.info(`🔗 Magic link for ${body.email}: /api/v1/auth/verify?token=${token}`);
    console.log(`\n✉️  Magic Link Token: ${token}\n`);

    return reply.status(200).send({ message: 'Magic link sent (check server console in MVP mode)' });
  });

  /**
   * POST /api/v1/auth/verify
   * Exchange magic token for JWT.
   */
  app.post('/api/v1/auth/verify', async (request, reply) => {
    const body = verifyBodySchema.parse(request.body);
    const entry = magicTokens.get(body.token);

    if (!entry || entry.email !== body.email || entry.expiresAt < Date.now()) {
      magicTokens.delete(body.token);
      return reply.status(401).send({ error: 'Invalid or expired token', code: 401 });
    }

    magicTokens.delete(body.token);

    let user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: body.email,
          settings: {
            create: {},
          },
        },
      });
    }

    const accessToken = app.jwt.sign({ userId: user.id, email: user.email });

    return reply.status(200).send({
      accessToken,
      user: { id: user.id, email: user.email },
    });
  });
}
