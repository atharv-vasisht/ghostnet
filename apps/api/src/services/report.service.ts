import { prisma } from './auth.service.js';

const SERVICE_RECOMMENDATIONS: Record<string, string> = {
  iam: 'Review IAM policies and rotate all access keys that may have been enumerated.',
  secrets:
    'Immediately rotate all credentials stored in the secrets vault that were accessed.',
  api: 'Audit internal API access logs and implement IP-based allowlisting.',
  s3: 'Review S3 bucket policies, enable access logging, and audit all downloaded objects for data exfiltration.',
  oauth:
    'Review OAuth token grants and revoke any suspicious client authorizations.',
  discovery:
    'Restrict access to service discovery endpoints and monitor for reconnaissance patterns.',
};

export interface SessionReport {
  executiveSummary: {
    sessionId: string;
    riskLevel: string;
    riskScore: number;
    inferredGoal: string | null;
    goalConfidence: number;
    durationMs: number;
    eventCount: number;
    servicesTouched: string[];
    summary: string;
  };
  timeline: Array<{
    timestamp: string;
    targetService: string;
    action: string;
    responseCode: number;
    tags: string[];
  }>;
  beliefState: {
    inferredGoal: string | null;
    goalConfidence: number;
    believedAssets: unknown[];
    explorationPath: string[];
  };
  iocs: {
    sourceIps: string[];
    userAgents: string[];
    behavioralSignatures: string[];
  };
  recommendations: string[];
}

function buildSummary(
  session: {
    riskLevel: string;
    eventCount: number;
    servicesTouched: string[];
    inferredGoal: string | null;
    goalConfidence: number;
    sourceIp: string;
  },
  durationMs: number,
): string {
  const durationMin = Math.round(durationMs / 60_000);
  const duration =
    durationMin > 0 ? `${durationMin} minute(s)` : 'less than a minute';

  let summary = `A ${session.riskLevel.toLowerCase()}-risk session originating from ${session.sourceIp} `;
  summary += `was active for ${duration}, generating ${session.eventCount} events `;
  summary += `across ${session.servicesTouched.length} service(s) (${session.servicesTouched.join(', ')}).`;

  if (session.inferredGoal) {
    summary += ` The inferred goal is "${session.inferredGoal}" with ${session.goalConfidence}% confidence.`;
  }

  return summary;
}

export async function generateSessionReport(
  sessionId: string,
  orgId: string,
): Promise<SessionReport | null> {
  const session = await prisma.agentSession.findUnique({
    where: { id: sessionId },
    include: {
      events: { orderBy: { timestamp: 'asc' } },
    },
  });

  if (!session || session.orgId !== orgId) return null;

  const sourceIps = [...new Set(session.events.map((e) => e.sourceIp))];
  const userAgents = [...new Set(session.events.map((e) => e.userAgent))];
  const allTags = [...new Set(session.events.flatMap((e) => e.tags))];

  const durationMs =
    session.lastSeenAt.getTime() - session.firstSeenAt.getTime();

  const recommendations = session.servicesTouched
    .map((s) => SERVICE_RECOMMENDATIONS[s])
    .filter((r): r is string => r !== undefined);

  if (session.riskLevel === 'CRITICAL' || session.riskLevel === 'HIGH') {
    recommendations.unshift(
      'Conduct a thorough investigation of the source IP addresses and correlate with other security tools.',
    );
  }

  const summary = buildSummary(session, durationMs);
  const assets = Array.isArray(session.believedAssets)
    ? session.believedAssets
    : [];

  return {
    executiveSummary: {
      sessionId: session.id,
      riskLevel: session.riskLevel,
      riskScore: session.riskScore,
      inferredGoal: session.inferredGoal,
      goalConfidence: session.goalConfidence,
      durationMs,
      eventCount: session.eventCount,
      servicesTouched: session.servicesTouched,
      summary,
    },
    timeline: session.events.map((e) => ({
      timestamp: e.timestamp.toISOString(),
      targetService: e.targetService,
      action: e.action,
      responseCode: e.responseCode,
      tags: e.tags,
    })),
    beliefState: {
      inferredGoal: session.inferredGoal,
      goalConfidence: session.goalConfidence,
      believedAssets: assets as unknown[],
      explorationPath: session.explorationPath,
    },
    iocs: {
      sourceIps,
      userAgents,
      behavioralSignatures: allTags,
    },
    recommendations,
  };
}
