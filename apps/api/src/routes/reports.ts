import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/authenticate.js';
import { generateSessionReport } from '../services/report.service.js';

const paramsSchema = z.object({ id: z.string().uuid() });

export default async function reportRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  fastify.addHook('preHandler', requireAuth);

  fastify.get('/sessions/:id', async (request, reply) => {
    const user = request.user!;
    const { id } = paramsSchema.parse(request.params);

    const report = await generateSessionReport(id, user.orgId);
    if (!report) {
      reply
        .code(404)
        .send({ error: 'Not Found', message: 'Session not found' });
      return;
    }

    return report;
  });
}
