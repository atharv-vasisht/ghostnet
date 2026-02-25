import { PrismaClient } from '@prisma/client';
import IORedis from 'ioredis';
import type { Logger } from 'winston';
import type { RawEvent, Asset } from '@ghostnet/shared';
import { updateBelief } from '../engines/belief-mapper.js';

const prisma = new PrismaClient();
const redisPub = new IORedis(process.env['REDIS_URL'] ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export async function processBeliefUpdate(
  sessionId: string,
  event: RawEvent,
  tags: string[],
  logger: Logger,
): Promise<void> {
  const session = await prisma.agentSession.findUniqueOrThrow({
    where: { id: sessionId },
  });

  const existingAssets = (
    Array.isArray(session.believedAssets) ? session.believedAssets : []
  ) as unknown as Asset[];

  const belief = updateBelief({
    responseBody: event.responseBody,
    targetService: event.targetService,
    action: event.action,
    explorationPath: session.explorationPath,
    discoveredAssets: existingAssets,
    tags,
    sessionEventCount: session.eventCount,
    sessionServicesTouched: session.servicesTouched,
  });

  await prisma.agentSession.update({
    where: { id: sessionId },
    data: {
      inferredGoal: belief.inferredGoal,
      goalConfidence: belief.confidence,
      believedAssets: JSON.parse(JSON.stringify(belief.discoveredAssets)),
      explorationPath: belief.explorationPath,
    },
  });

  const wsPayload = {
    orgId: session.orgId,
    sessionId,
    beliefState: {
      sessionId,
      inferredGoal: {
        goal: belief.inferredGoal,
        confidence: belief.confidence,
        evidence: `Path: ${belief.explorationPath.join(' → ')}`,
      },
      confidenceScore: belief.confidence,
      explorationPath: belief.explorationPath,
      discoveredAssets: belief.discoveredAssets,
      currentDepth: belief.explorationPath.length,
    },
  };

  await redisPub.publish('ws:belief:updated', JSON.stringify(wsPayload));

  logger.debug('belief_updated', {
    sessionId,
    goal: belief.inferredGoal,
    confidence: belief.confidence,
    assetsCount: belief.discoveredAssets.length,
  });
}
