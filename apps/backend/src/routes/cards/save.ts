import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { SaveRequestSchema } from '@noteseed/shared-types';
import { dispatch } from '@noteseed/adapters';
import { prisma } from '../../lib/prisma.js';
import { decrypt } from '../../utils/crypto.js';
import { authGuard } from '../../plugins/auth-guard.js';

export async function cardsSaveRoute(app: FastifyInstance) {
  app.post(
    '/api/v1/cards/save',
    { preHandler: [authGuard] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = SaveRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Invalid request body',
          details: parsed.error.issues,
        });
      }

      const saveRequest = parsed.data;
      const userId = request.user.userId;

      const credentialResolver = async (target: string): Promise<unknown> => {
        const cred = await prisma.userCredential.findUnique({
          where: { userId_target: { userId, target } },
        });
        if (!cred) return null;
        try {
          const decrypted = decrypt(cred.encryptedData);
          return JSON.parse(decrypted) as unknown;
        } catch {
          return null;
        }
      };

      try {
        const result = await dispatch(saveRequest, credentialResolver);

        for (const r of result.results) {
          await prisma.saveLog.create({
            data: {
              userId,
              cardId: saveRequest.card.id,
              target: r.target,
              status: r.success ? 'success' : 'failed',
              responseJson: r.success ? { targetRef: r.targetRef, targetUrl: r.targetUrl } : undefined,
              errorMessage: r.error,
            },
          });
        }

        request.log.info(
          { requestId: result.requestId, targets: saveRequest.targets },
          'card save dispatched',
        );

        return reply.send(result);
      } catch (err) {
        request.log.error({ err }, 'card save failed');
        return reply.status(500).send({
          error: 'Save failed',
          message: err instanceof Error ? err.message : String(err),
        });
      }
    },
  );
}
