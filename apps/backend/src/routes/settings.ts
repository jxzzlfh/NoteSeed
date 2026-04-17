import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authGuard } from '../plugins/auth-guard.js';

const UpdateSettingsBody = z.object({
  defaultTemplate: z.string().optional(),
  defaultTarget: z.string().optional(),
  outputLanguage: z.string().optional(),
  retentionLevel: z.enum(['minimal', 'standard', 'detailed']).optional(),
  enabledSkills: z.record(z.boolean()).optional(),
});

export async function settingsRoutes(app: FastifyInstance) {
  app.get(
    '/api/v1/settings',
    { preHandler: [authGuard] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId } = request.user;
      const settings = await prisma.userSettings.findUnique({
        where: { userId },
      });
      if (!settings) {
        return reply.send({
          defaultTemplate: 'auto',
          defaultTarget: 'memos',
          outputLanguage: 'zh-CN',
          retentionLevel: 'standard',
          enabledSkills: {},
        });
      }
      return reply.send({
        defaultTemplate: settings.defaultTemplate,
        defaultTarget: settings.defaultTarget,
        outputLanguage: settings.outputLanguage,
        retentionLevel: settings.retentionLevel,
        enabledSkills: settings.enabledSkillsJson,
      });
    },
  );

  app.put(
    '/api/v1/settings',
    { preHandler: [authGuard] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = UpdateSettingsBody.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Invalid body', details: parsed.error.issues });
      }

      const { userId } = request.user;
      const data: Record<string, unknown> = {};
      if (parsed.data.defaultTemplate !== undefined) data.defaultTemplate = parsed.data.defaultTemplate;
      if (parsed.data.defaultTarget !== undefined) data.defaultTarget = parsed.data.defaultTarget;
      if (parsed.data.outputLanguage !== undefined) data.outputLanguage = parsed.data.outputLanguage;
      if (parsed.data.retentionLevel !== undefined) data.retentionLevel = parsed.data.retentionLevel;
      if (parsed.data.enabledSkills !== undefined) data.enabledSkillsJson = parsed.data.enabledSkills;

      await prisma.userSettings.upsert({
        where: { userId },
        create: { userId, ...data },
        update: data,
      });

      return reply.send({ ok: true });
    },
  );
}
