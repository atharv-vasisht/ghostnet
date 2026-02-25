import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/auth.service.js';

const DEMO_ORG_SLUG = process.env.DEMO_ORG_SLUG ?? 'demo';

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  sortBy: z
    .enum(['firstSeenAt', 'lastSeenAt', 'riskScore', 'eventCount'])
    .default('firstSeenAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const eventQuerySchema = z.object({
  sessionId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

const paramsSchema = z.object({ id: z.string().uuid() });

let cachedDemoOrgId: string | null = null;

async function getDemoOrgId(): Promise<string> {
  if (cachedDemoOrgId) return cachedDemoOrgId;

  const org = await prisma.organization.findUnique({
    where: { slug: DEMO_ORG_SLUG },
    select: { id: true },
  });

  if (!org) {
    throw Object.assign(
      new Error('Demo organization not configured'),
      { statusCode: 404 },
    );
  }

  cachedDemoOrgId = org.id;
  return org.id;
}

export default async function demoRoutes(
  fastify: FastifyInstance,
): Promise<void> {

  /* ── Sessions ── */

  fastify.get('/sessions', async (request) => {
    const orgId = await getDemoOrgId();
    const query = listQuerySchema.parse(request.query);
    const skip = (query.page - 1) * query.limit;

    const orderBy = { [query.sortBy]: query.sortOrder } as Record<string, 'asc' | 'desc'>;

    const [sessions, total] = await Promise.all([
      prisma.agentSession.findMany({
        where: { orgId },
        orderBy,
        skip,
        take: query.limit,
      }),
      prisma.agentSession.count({ where: { orgId } }),
    ]);

    return {
      sessions,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
  });

  fastify.get('/sessions/:id', async (request, reply) => {
    const orgId = await getDemoOrgId();
    const { id } = paramsSchema.parse(request.params);

    const session = await prisma.agentSession.findUnique({
      where: { id },
      include: {
        events: { orderBy: { timestamp: 'desc' }, take: 200 },
        alerts: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!session || session.orgId !== orgId) {
      reply
        .code(404)
        .send({ error: 'Not Found', message: 'Demo session not found' });
      return;
    }

    return session;
  });

  /* ── Events ── */

  fastify.get('/events', async (request) => {
    const orgId = await getDemoOrgId();
    const query = eventQuerySchema.parse(request.query);
    const skip = (query.page - 1) * query.limit;

    const where: Record<string, unknown> = { orgId };
    if (query.sessionId) {
      where.sessionId = query.sessionId;
    }

    const [events, total] = await Promise.all([
      prisma.agentEvent.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: query.limit,
      }),
      prisma.agentEvent.count({ where }),
    ]);

    return { events, total };
  });

  /* ── Alerts ── */

  fastify.get('/alerts', async () => {
    const orgId = await getDemoOrgId();
    return prisma.alert.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      include: { rule: { select: { name: true } } },
    });
  });

  fastify.get('/alerts/rules', async () => {
    const orgId = await getDemoOrgId();
    return prisma.alertRule.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });
  });

  /* ── Stats ── */

  fastify.get('/stats', async () => {
    const orgId = await getDemoOrgId();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalSessions,
      activeSessions,
      eventsLast24h,
      highRiskSessions,
      services,
      alerts,
    ] = await Promise.all([
      prisma.agentSession.count({ where: { orgId } }),
      prisma.agentSession.count({ where: { orgId, status: 'ACTIVE' } }),
      prisma.agentEvent.count({
        where: { orgId, timestamp: { gte: twentyFourHoursAgo } },
      }),
      prisma.agentSession.count({
        where: { orgId, riskLevel: { in: ['HIGH', 'CRITICAL'] } },
      }),
      prisma.agentEvent.findMany({
        where: { orgId },
        distinct: ['targetService'],
        select: { targetService: true },
      }),
      prisma.alert.count({ where: { orgId, acknowledged: false } }),
    ]);

    const sessions = await prisma.agentSession.findMany({
      where: { orgId },
      select: {
        riskScore: true,
        eventCount: true,
        servicesTouched: true,
        firstSeenAt: true,
        lastSeenAt: true,
      },
    });

    const avgRiskScore =
      sessions.length > 0
        ? Math.round(
            sessions.reduce((sum, s) => sum + s.riskScore, 0) / sessions.length
          )
        : 0;

    const serviceActivity: Record<string, number> = {};
    sessions.forEach((s) => {
      s.servicesTouched.forEach((svc) => {
        serviceActivity[svc] = (serviceActivity[svc] ?? 0) + s.eventCount;
      });
    });

    const now = new Date();
    const riskTimeline = Array.from({ length: 24 }, (_, i) => {
      const t = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
      const hourStr = t.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      const hourStart = new Date(t);
      hourStart.setMinutes(0, 0, 0);
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

      const activeDuringHour = sessions.filter((s) => {
        const first = new Date(s.firstSeenAt).getTime();
        const last = new Date(s.lastSeenAt).getTime();
        return first <= hourEnd.getTime() && last >= hourStart.getTime();
      });

      const score =
        activeDuringHour.length > 0
          ? Math.round(
              activeDuringHour.reduce((sum, s) => sum + s.riskScore, 0) /
                activeDuringHour.length
            )
          : 0;

      return { time: t.toISOString(), hour: hourStr, score };
    });

    return {
      activeSessions,
      totalSessions,
      totalEvents: eventsLast24h,
      activeAlerts: alerts,
      avgRiskScore,
      highRiskSessions,
      sessionsDelta: 2,
      eventsDelta: 15,
      alertsDelta: 1,
      riskDelta: 5,
      servicesTriggered: services.map((s) => s.targetService),
      serviceActivity,
      riskTimeline,
    };
  });
}
