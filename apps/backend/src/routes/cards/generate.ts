import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PageSourceSchema } from '@noteseed/shared-types';
import type { AIProviderConfig } from '@noteseed/shared-types';
import { generateCard } from '@noteseed/skills';
import { authGuard } from '../../plugins/auth-guard.js';
import { prisma } from '../../lib/prisma.js';

const AIProviderSchema = z.object({
  provider: z.enum(['anthropic', 'openai']),
  apiKey: z.string().min(1),
  baseUrl: z.string().optional(),
  models: z.object({
    fast: z.string().min(1),
    powerful: z.string().min(1),
  }),
});

const GenerateBodySchema = z.object({
  source: PageSourceSchema,
  options: z
    .object({
      preferredTemplate: z.string().optional(),
      retentionLevel: z.enum(['minimal', 'standard', 'detailed']).optional(),
      target: z.string().optional(),
      userTagHistory: z.array(z.string()).optional(),
    })
    .optional(),
});

/**
 * Resolves AI provider config with priority:
 * 1. User's saved aiProviderJson from DB
 * 2. Server-wide ANTHROPIC_API_KEY from env
 */
async function resolveAIProvider(userId: string): Promise<AIProviderConfig | undefined> {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: { aiProviderJson: true },
  });

  if (settings?.aiProviderJson) {
    const parsed = AIProviderSchema.safeParse(settings.aiProviderJson);
    if (parsed.success) return parsed.data;
  }

  return undefined;
}

export async function cardsGenerateRoute(app: FastifyInstance) {
  app.post(
    '/api/v1/cards/generate',
    { preHandler: [authGuard] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = GenerateBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Invalid request body',
          details: parsed.error.issues,
        });
      }

      const { source, options } = parsed.data;
      const start = performance.now();

      try {
        const aiProvider = await resolveAIProvider(request.user.userId);

        const result = await generateCard(source, {
          ...options,
          aiProvider,
        });

        request.log.info(
          {
            timings: result.timings,
            pageType: result.card.analysis.pageType,
            totalMs: Math.round(performance.now() - start),
            provider: aiProvider?.provider ?? 'env-default',
          },
          'card generated',
        );

        return reply.send({ card: result.card, timings: result.timings });
      } catch (err) {
        request.log.error({ err }, 'card generation failed');
        return reply.status(500).send({
          error: 'Card generation failed',
          message: err instanceof Error ? err.message : String(err),
        });
      }
    },
  );
}
