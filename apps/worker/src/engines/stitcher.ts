import crypto from 'node:crypto';
import IORedis from 'ioredis';
import { PrismaClient } from '@prisma/client';

const SESSION_WINDOW_MS = 30 * 60 * 1000; // 30 minutes
const SESSION_KEY_PREFIX = 'session:active:';

const redis = new IORedis(process.env['REDIS_URL'] ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const prisma = new PrismaClient();

export interface StitchedResult {
  sessionId: string;
  isNew: boolean;
}

export async function stitchSession(
  sessionKey: string,
  orgId: string,
  sourceIp: string,
  userAgent: string,
): Promise<StitchedResult> {
  const redisKey = `${SESSION_KEY_PREFIX}${sessionKey}`;
  const existing = await redis.get(redisKey);

  if (existing) {
    const { sessionId, lastSeen } = JSON.parse(existing) as {
      sessionId: string;
      lastSeen: number;
    };

    if (Date.now() - lastSeen < SESSION_WINDOW_MS) {
      await redis.set(
        redisKey,
        JSON.stringify({ sessionId, lastSeen: Date.now() }),
        'PX',
        SESSION_WINDOW_MS,
      );
      return { sessionId, isNew: false };
    }
  }

  const sessionId = crypto.randomUUID();

  await prisma.agentSession.create({
    data: {
      id: sessionId,
      orgId,
      sourceIp,
      userAgent,
      servicesTouched: [],
      explorationPath: [],
      believedAssets: '[]',
    },
  });

  await redis.set(
    redisKey,
    JSON.stringify({ sessionId, lastSeen: Date.now() }),
    'PX',
    SESSION_WINDOW_MS,
  );

  return { sessionId, isNew: true };
}
