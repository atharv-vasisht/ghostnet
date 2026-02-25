import { prisma } from './auth.service.js';
import type { Prisma, RiskLevel, SessionStatus } from '@prisma/client';

export interface SessionListParams {
  orgId: string;
  riskLevel?: RiskLevel[];
  service?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  sourceIp?: string;
  status?: SessionStatus;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface EventListParams {
  orgId: string;
  sessionId?: string;
  targetService?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  page: number;
  limit: number;
}

function buildSessionWhere(params: SessionListParams): Prisma.AgentSessionWhereInput {
  const where: Prisma.AgentSessionWhereInput = { orgId: params.orgId };

  if (params.riskLevel?.length) {
    where.riskLevel = { in: params.riskLevel };
  }
  if (params.service?.length) {
    where.servicesTouched = { hasSome: params.service };
  }
  if (params.sourceIp) {
    where.sourceIp = { contains: params.sourceIp };
  }
  if (params.status) {
    where.status = params.status;
  }
  if (params.dateFrom || params.dateTo) {
    where.firstSeenAt = {
      ...(params.dateFrom ? { gte: params.dateFrom } : {}),
      ...(params.dateTo ? { lte: params.dateTo } : {}),
    };
  }

  return where;
}

export function buildEventWhere(params: EventListParams): Prisma.AgentEventWhereInput {
  const where: Prisma.AgentEventWhereInput = { orgId: params.orgId };

  if (params.sessionId) where.sessionId = params.sessionId;
  if (params.targetService) where.targetService = params.targetService;
  if (params.tags?.length) where.tags = { hasSome: params.tags };
  if (params.dateFrom || params.dateTo) {
    where.timestamp = {
      ...(params.dateFrom ? { gte: params.dateFrom } : {}),
      ...(params.dateTo ? { lte: params.dateTo } : {}),
    };
  }

  return where;
}

export async function listSessions(params: SessionListParams) {
  const where = buildSessionWhere(params);
  const skip = (params.page - 1) * params.limit;
  const orderBy = {
    [params.sortBy]: params.sortOrder,
  } as Prisma.AgentSessionOrderByWithRelationInput;

  const [sessions, total] = await Promise.all([
    prisma.agentSession.findMany({ where, orderBy, skip, take: params.limit }),
    prisma.agentSession.count({ where }),
  ]);

  return { sessions, total, page: params.page, limit: params.limit };
}

export async function getSessionById(id: string, orgId: string) {
  const session = await prisma.agentSession.findUnique({
    where: { id },
    include: {
      events: { orderBy: { timestamp: 'desc' }, take: 100 },
      alerts: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!session || session.orgId !== orgId) return null;
  return session;
}

export async function getSessionEventsForExport(sessionId: string, orgId: string) {
  const session = await prisma.agentSession.findUnique({
    where: { id: sessionId },
    select: { orgId: true },
  });

  if (!session || session.orgId !== orgId) return null;

  return prisma.agentEvent.findMany({
    where: { sessionId },
    orderBy: { timestamp: 'asc' },
  });
}

export async function listEvents(params: EventListParams) {
  const where = buildEventWhere(params);
  const skip = (params.page - 1) * params.limit;

  const [events, total] = await Promise.all([
    prisma.agentEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip,
      take: params.limit,
    }),
    prisma.agentEvent.count({ where }),
  ]);

  return { events, total, page: params.page, limit: params.limit };
}

export function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function eventsToCsv(
  events: Array<{
    id: string;
    sessionId: string;
    timestamp: Date;
    sourceIp: string;
    userAgent: string;
    targetService: string;
    action: string;
    responseCode: number;
    durationMs: number;
    tags: string[];
  }>,
): string {
  const headers = [
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

  const rows = events.map((e) =>
    [
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
    ].map(escapeCsvField),
  );

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
