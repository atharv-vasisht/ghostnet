import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Readable } from 'node:stream';
import { requireAuth } from '../middleware/authenticate.js';
import {
  listEvents,
  buildEventWhere,
  escapeCsvField,
  type EventListParams,
} from '../services/session.service.js';
import { prisma } from '../services/auth.service.js';

const listQuerySchema = z.object({
  sessionId: z.string().uuid().optional(),
  targetService: z.string().optional(),
  tags: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
});

function parseEventFilters(
  orgId: string,
  query: z.infer<typeof listQuerySchema>,
): EventListParams {
  return {
    orgId,
    sessionId: query.sessionId,
    targetService: query.targetService,
    tags: query.tags
      ?.split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0),
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    page: query.page,
    limit: query.limit,
  };
}

export default async function eventRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  fastify.addHook('preHandler', requireAuth);

  fastify.get('/', async (request) => {
    const user = request.user!;
    const query = listQuerySchema.parse(request.query);
    return listEvents(parseEventFilters(user.orgId, query));
  });

  fastify.get('/export', async (request, reply) => {
    const user = request.user!;
    const query = listQuerySchema.parse(request.query);
    const where = buildEventWhere(parseEventFilters(user.orgId, query));

    const csvHeaders = [
      'id',
      'sessionId',
      'timestamp',
      'sourceIp',
      'userAgent',
      'targetService',
      'action',
      'responseCode',
      'durationMs',
      'tags',
    ];

    async function* generate() {
      yield csvHeaders.join(',') + '\n';

      let skip = 0;
      const batchSize = 500;

      for (;;) {
        const batch = await prisma.agentEvent.findMany({
          where,
          orderBy: { timestamp: 'asc' },
          skip,
          take: batchSize,
        });

        if (batch.length === 0) break;

        for (const e of batch) {
          const row = [
            e.id,
            e.sessionId,
            e.timestamp.toISOString(),
            e.sourceIp,
            e.userAgent,
            e.targetService,
            e.action,
            String(e.responseCode),
            String(e.durationMs),
            e.tags.join(';'),
          ].map(escapeCsvField);
          yield row.join(',') + '\n';
        }

        skip += batchSize;
      }
    }

    const stream = Readable.from(generate());
    reply.header('Content-Type', 'text/csv');
    reply.header(
      'Content-Disposition',
      'attachment; filename="events.csv"',
    );
    return reply.send(stream);
  });
}
