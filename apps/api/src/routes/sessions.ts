import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { RiskLevel, SessionStatus } from '@prisma/client';
import { requireAuth } from '../middleware/authenticate.js';
import {
  listSessions,
  getSessionById,
  getSessionEventsForExport,
  eventsToCsv,
} from '../services/session.service.js';

const listQuerySchema = z.object({
  riskLevel: z.string().optional(),
  service: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sourceIp: z.string().optional(),
  status: z.nativeEnum(SessionStatus).optional(),
  sortBy: z
    .enum(['firstSeenAt', 'lastSeenAt', 'riskScore', 'eventCount'])
    .default('firstSeenAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
});

const idParamsSchema = z.object({ id: z.string().uuid() });

const validRiskLevels = new Set<string>(Object.values(RiskLevel));

export default async function sessionRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  fastify.addHook('preHandler', requireAuth);

  fastify.get('/', async (request) => {
    const user = request.user!;
    const query = listQuerySchema.parse(request.query);

    const riskLevel = query.riskLevel
      ?.split(',')
      .map((v) => v.trim())
      .filter((v) => validRiskLevels.has(v)) as RiskLevel[] | undefined;

    const service = query.service
      ?.split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    return listSessions({
      orgId: user.orgId,
      riskLevel: riskLevel?.length ? riskLevel : undefined,
      service: service?.length ? service : undefined,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      sourceIp: query.sourceIp,
      status: query.status,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      page: query.page,
      limit: query.limit,
    });
  });

  fastify.get('/:id', async (request, reply) => {
    const user = request.user!;
    const { id } = idParamsSchema.parse(request.params);

    const session = await getSessionById(id, user.orgId);
    if (!session) {
      reply
        .code(404)
        .send({ error: 'Not Found', message: 'Session not found' });
      return;
    }

    return session;
  });

  fastify.get('/:id/export', async (request, reply) => {
    const user = request.user!;
    const { id } = idParamsSchema.parse(request.params);

    const events = await getSessionEventsForExport(id, user.orgId);
    if (!events) {
      reply
        .code(404)
        .send({ error: 'Not Found', message: 'Session not found' });
      return;
    }

    const csv = eventsToCsv(events);

    reply.header('Content-Type', 'text/csv');
    reply.header(
      'Content-Disposition',
      `attachment; filename=session-${id}.csv`,
    );
    return csv;
  });
}
