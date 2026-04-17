import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PageSourceSchema } from '@noteseed/shared-types';
import { generateCard } from '@noteseed/skills';
import { authGuard } from '../../plugins/auth-guard.js';

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
        const result = await generateCard(source, options ?? {});

        request.log.info(
          {
            timings: result.timings,
            pageType: result.card.analysis.pageType,
            totalMs: Math.round(performance.now() - start),
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
