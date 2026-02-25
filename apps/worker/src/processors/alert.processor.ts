import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import type { AgentSession, AlertRule as PrismaAlertRule } from '@prisma/client';
import IORedis from 'ioredis';
import type { Logger } from 'winston';
import type { RiskLevel } from '@ghostnet/shared';

const prisma = new PrismaClient();
const redisPub = new IORedis(process.env['REDIS_URL'] ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

function severityFromRisk(riskLevel: string): RiskLevel {
  const map: Record<string, RiskLevel> = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
  };
  return map[riskLevel] ?? 'LOW';
}

function checkTrigger(
  rule: PrismaAlertRule,
  tags: string[],
  session: AgentSession,
  isNewSession: boolean,
): boolean {
  switch (rule.trigger) {
    case 'DEPTH_THRESHOLD':
      return session.depthScore >= (rule.threshold ?? 3);

    case 'CREDENTIAL_ACCESS':
      return tags.includes('credential_harvesting');

    case 'BULK_EXFILTRATION':
      return tags.includes('exfiltration_attempt');

    case 'PERSISTENCE_ATTEMPT':
      return tags.includes('persistence_attempt');

    case 'DEEP_PROBE':
      return tags.includes('deep_probe');

    case 'FIRST_CONTACT':
      return isNewSession;

    default:
      return false;
  }
}

export async function evaluateAlerts(
  orgId: string,
  sessionId: string,
  tags: string[],
  session: AgentSession,
  isNewSession: boolean,
  logger: Logger,
): Promise<void> {
  const rules = await prisma.alertRule.findMany({
    where: { orgId, enabled: true },
  });

  for (const rule of rules) {
    if (!checkTrigger(rule, tags, session, isNewSession)) continue;

    if (rule.services.length > 0) {
      const sessionServices = new Set(session.servicesTouched);
      const matchesService = rule.services.some((s) => sessionServices.has(s));
      if (!matchesService) continue;
    }

    const alert = await prisma.alert.create({
      data: {
        id: crypto.randomUUID(),
        orgId,
        ruleId: rule.id,
        sessionId,
        title: `${rule.name} triggered`,
        description: `Rule "${rule.name}" fired for session ${sessionId}. Tags: ${tags.join(', ')}`,
        severity: severityFromRisk(session.riskLevel),
      },
    });

    const wsPayload = {
      alert: {
        ...alert,
        createdAt: alert.createdAt.toISOString(),
      },
    };

    await redisPub.publish('ws:alert:fired', JSON.stringify(wsPayload));

    logger.info('alert_fired', {
      alertId: alert.id,
      ruleId: rule.id,
      ruleName: rule.name,
      trigger: rule.trigger,
      sessionId,
    });
  }
}
