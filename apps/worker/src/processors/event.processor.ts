import { PrismaClient } from '@prisma/client';
import IORedis from 'ioredis';
import type { Logger } from 'winston';
import type { RawEvent, TargetService, BehavioralTag } from '@ghostnet/shared';
import { stitchSession } from '../engines/stitcher.js';
import { computeTags } from '../engines/tagger.js';
import { updateSessionRisk } from './session.processor.js';
import { processBeliefUpdate } from './belief.processor.js';
import { evaluateAlerts } from './alert.processor.js';

const prisma = new PrismaClient();
const redisPub = new IORedis(process.env['REDIS_URL'] ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

interface QueuePayload extends RawEvent {
  tags?: string[];
}

export async function processEvent(
  data: Record<string, unknown>,
  logger: Logger,
): Promise<void> {
  const raw = data as unknown as QueuePayload;

  const { sessionId, isNew } = await stitchSession(
    raw.sessionKey,
    raw.orgId,
    raw.sourceIp,
    raw.userAgent,
  );

  const session = await prisma.agentSession.findUniqueOrThrow({
    where: { id: sessionId },
  });

  const tags = computeTags({
    targetService: raw.targetService,
    action: raw.action,
    sessionServicesTouched: session.servicesTouched,
    sessionEventCount: session.eventCount,
    requestHeaders: raw.requestHeaders,
    existingTags: raw.tags ?? [],
  });

  const event = await prisma.agentEvent.create({
    data: {
      sessionId,
      orgId: raw.orgId,
      sourceIp: raw.sourceIp,
      userAgent: raw.userAgent,
      targetService: raw.targetService,
      action: raw.action,
      requestHeaders: raw.requestHeaders as Record<string, string>,
      requestBody: (raw.requestBody ?? undefined) as undefined | Record<string, string>,
      queryParams: raw.queryParams as Record<string, string>,
      responseCode: raw.responseCode,
      responseBody: (raw.responseBody ?? undefined) as undefined | Record<string, string>,
      durationMs: raw.durationMs,
      tags,
    },
  });

  const newServicesTouched = session.servicesTouched.includes(raw.targetService)
    ? session.servicesTouched
    : [...session.servicesTouched, raw.targetService];

  await prisma.agentSession.update({
    where: { id: sessionId },
    data: {
      eventCount: { increment: 1 },
      servicesTouched: newServicesTouched,
      lastSeenAt: new Date(),
    },
  });

  const updatedSession = await updateSessionRisk(sessionId, tags);

  await processBeliefUpdate(sessionId, raw, tags, logger);

  await evaluateAlerts(
    raw.orgId,
    sessionId,
    tags,
    updatedSession,
    isNew,
    logger,
  );

  await publishWsEvent('event:new', {
    event: {
      ...event,
      timestamp: event.timestamp.toISOString(),
      tags: tags as BehavioralTag[],
    },
  });

  if (isNew) {
    const freshSession = await prisma.agentSession.findUniqueOrThrow({
      where: { id: sessionId },
    });
    await publishWsEvent('session:new', {
      session: serializeSession(freshSession),
    });
  } else {
    await publishWsEvent('session:updated', {
      orgId: updatedSession.orgId,
      sessionId,
      updates: {
        eventCount: updatedSession.eventCount,
        servicesTouched: updatedSession.servicesTouched,
        riskScore: updatedSession.riskScore,
        riskLevel: updatedSession.riskLevel,
        lastSeenAt: updatedSession.lastSeenAt.toISOString(),
      },
    });
  }
}

async function publishWsEvent(
  channel: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await redisPub.publish(`ws:${channel}`, JSON.stringify(payload));
}

function serializeSession(session: {
  id: string;
  orgId: string;
  sourceIp: string;
  userAgent: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
  status: string;
  eventCount: number;
  servicesTouched: string[];
  riskScore: number;
  riskLevel: string;
  depthScore: number;
  inferredGoal: string | null;
  goalConfidence: number;
  believedAssets: unknown;
  explorationPath: string[];
}): Record<string, unknown> {
  return {
    ...session,
    firstSeenAt: session.firstSeenAt.toISOString(),
    lastSeenAt: session.lastSeenAt.toISOString(),
  };
}
