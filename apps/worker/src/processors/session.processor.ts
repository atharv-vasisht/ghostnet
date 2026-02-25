import { PrismaClient } from '@prisma/client';
import type { AgentSession } from '@prisma/client';
import type { RiskLevel } from '@ghostnet/shared';

const prisma = new PrismaClient();

const IDLE_THRESHOLD_MS = 30 * 60 * 1000;   // 30 minutes
const CLOSED_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours

function computeRiskScore(session: AgentSession, newTags: string[]): number {
  let score = 0;

  score += Math.min(session.eventCount * 2, 20);

  const uniqueServices = new Set(session.servicesTouched);
  score += Math.min(uniqueServices.size * 5, 20);

  const highRiskTags = [
    'credential_harvesting',
    'lateral_movement',
    'exfiltration_attempt',
    'persistence_attempt',
  ];

  const allTags = new Set(newTags);
  for (const tag of highRiskTags) {
    if (allTags.has(tag)) score += 10;
  }

  if (allTags.has('deep_probe')) score += 5;

  score += Math.min(session.depthScore * 3, 15);

  return Math.min(score, 100);
}

function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 76) return 'CRITICAL';
  if (score >= 51) return 'HIGH';
  if (score >= 26) return 'MEDIUM';
  return 'LOW';
}

export async function updateSessionRisk(
  sessionId: string,
  newTags: string[],
): Promise<AgentSession> {
  const session = await prisma.agentSession.findUniqueOrThrow({
    where: { id: sessionId },
  });

  const riskScore = computeRiskScore(session, newTags);
  const riskLevel = riskLevelFromScore(riskScore);

  const uniqueServices = new Set(session.servicesTouched);
  const depthScore = uniqueServices.size;

  return prisma.agentSession.update({
    where: { id: sessionId },
    data: { riskScore, riskLevel, depthScore },
  });
}

export async function expireIdleSessions(): Promise<number> {
  const now = Date.now();

  const activeSessions = await prisma.agentSession.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, lastSeenAt: true },
  });

  let updated = 0;

  for (const session of activeSessions) {
    const elapsed = now - session.lastSeenAt.getTime();

    if (elapsed >= CLOSED_THRESHOLD_MS) {
      await prisma.agentSession.update({
        where: { id: session.id },
        data: { status: 'CLOSED' },
      });
      updated++;
    } else if (elapsed >= IDLE_THRESHOLD_MS) {
      await prisma.agentSession.update({
        where: { id: session.id },
        data: { status: 'IDLE' },
      });
      updated++;
    }
  }

  return updated;
}
