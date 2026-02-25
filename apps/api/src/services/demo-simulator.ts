import { randomUUID } from 'node:crypto';
import IORedis from 'ioredis';
import { prisma } from './auth.service.js';

const DEMO_ORG_SLUG = process.env.DEMO_ORG_SLUG ?? 'demo';
const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

const MIN_INTERVAL_MS = 3_000;
const MAX_INTERVAL_MS = 8_000;

interface SimulatedEvent {
  targetService: string;
  action: string;
  responseCode: number;
  tags: string[];
  requestHeaders: Record<string, string>;
  requestBody: Record<string, unknown> | null;
  queryParams: Record<string, string>;
  responseBody: Record<string, unknown> | null;
  durationMs: number;
}

const SIMULATION_POOL: SimulatedEvent[] = [
  {
    targetService: 'discovery',
    action: 'ListServices',
    responseCode: 200,
    tags: ['initial_recon'],
    requestHeaders: { 'accept': 'application/json', 'user-agent': 'python-httpx/0.24.1' },
    requestBody: null,
    queryParams: {},
    responseBody: { services: ['iam', 'secrets', 'api', 's3'], environment: 'production' },
    durationMs: 45,
  },
  {
    targetService: 'iam',
    action: 'ListUsers',
    responseCode: 200,
    tags: ['credential_harvesting'],
    requestHeaders: { 'authorization': 'AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/...', 'content-type': 'application/x-www-form-urlencoded' },
    requestBody: { Action: 'ListUsers', Version: '2010-05-08' },
    queryParams: {},
    responseBody: { Users: [{ UserName: 'jane.smith', UserId: 'AIDACKCEVSQ6C2EXAMPLE' }, { UserName: 'admin-service', UserId: 'AIDACKCEVSQ6C3EXAMPLE' }] },
    durationMs: 142,
  },
  {
    targetService: 'iam',
    action: 'GetCallerIdentity',
    responseCode: 200,
    tags: ['initial_recon'],
    requestHeaders: { 'authorization': 'AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/...', 'content-type': 'application/x-www-form-urlencoded' },
    requestBody: { Action: 'GetCallerIdentity' },
    queryParams: {},
    responseBody: { Account: '847291038475', Arn: 'arn:aws:iam::847291038475:user/probe-agent', UserId: 'AIDACKCEVSQ6CXPROBE' },
    durationMs: 98,
  },
  {
    targetService: 'iam',
    action: 'ListRoles',
    responseCode: 200,
    tags: ['credential_harvesting'],
    requestHeaders: { 'authorization': 'AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/...', 'content-type': 'application/x-www-form-urlencoded' },
    requestBody: { Action: 'ListRoles', Version: '2010-05-08' },
    queryParams: {},
    responseBody: { Roles: [{ RoleName: 'AdminAccess', Arn: 'arn:aws:iam::847291038475:role/AdminAccess' }] },
    durationMs: 118,
  },
  {
    targetService: 'secrets',
    action: 'ListSecrets',
    responseCode: 200,
    tags: ['credential_harvesting'],
    requestHeaders: { 'x-amz-target': 'secretsmanager.ListSecrets', 'content-type': 'application/x-amz-json-1.1' },
    requestBody: {},
    queryParams: {},
    responseBody: { SecretList: [{ Name: 'prod/database', ARN: 'arn:aws:secretsmanager:us-east-1:847291038475:secret:prod/database-xK9mP' }, { Name: 'prod/api-key' }] },
    durationMs: 72,
  },
  {
    targetService: 'secrets',
    action: 'GetSecretValue',
    responseCode: 200,
    tags: ['credential_harvesting', 'deep_probe'],
    requestHeaders: { 'x-amz-target': 'secretsmanager.GetSecretValue', 'content-type': 'application/x-amz-json-1.1' },
    requestBody: { SecretId: 'prod/database' },
    queryParams: {},
    responseBody: { Name: 'prod/database', SecretString: '{"username":"prod_admin","password":"xK9#mP2@vL5qR8","host":"prod-db.nexus-tech.io","port":5432}' },
    durationMs: 65,
  },
  {
    targetService: 'api',
    action: 'GET /api/v1/employees',
    responseCode: 200,
    tags: ['lateral_movement'],
    requestHeaders: { 'authorization': 'Bearer ghostnet_internal_token_abc123', 'accept': 'application/json' },
    requestBody: null,
    queryParams: { page: '1', limit: '50' },
    responseBody: { data: [{ id: 1, name: 'Jane Smith', email: 'jane.smith@nexus-tech.io' }], total: 487, page: 1 },
    durationMs: 55,
  },
  {
    targetService: 'api',
    action: 'GET /api/v1/projects',
    responseCode: 200,
    tags: ['lateral_movement'],
    requestHeaders: { 'authorization': 'Bearer ghostnet_internal_token_abc123', 'accept': 'application/json' },
    requestBody: null,
    queryParams: {},
    responseBody: { projects: [{ name: 'Project Aurora', status: 'active' }, { name: 'Nexus Gateway', status: 'active' }] },
    durationMs: 48,
  },
  {
    targetService: 'api',
    action: 'GET /api/v1/admin/config',
    responseCode: 200,
    tags: ['deep_probe', 'lateral_movement'],
    requestHeaders: { 'authorization': 'Bearer ghostnet_internal_token_abc123', 'accept': 'application/json' },
    requestBody: null,
    queryParams: {},
    responseBody: { database: { host: 'prod-db.nexus-tech.io' }, secrets_endpoint: 'https://secrets.nexus-tech.io', feature_flags: { beta_api: true } },
    durationMs: 42,
  },
  {
    targetService: 's3',
    action: 'ListBuckets',
    responseCode: 200,
    tags: ['deep_probe'],
    requestHeaders: { 'authorization': 'AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/...', 'host': 'storage.nexus-tech.io' },
    requestBody: null,
    queryParams: {},
    responseBody: { Buckets: [{ Name: 'prod-backups-2024' }, { Name: 'employee-records' }, { Name: 'audit-logs-archive' }] },
    durationMs: 38,
  },
  {
    targetService: 's3',
    action: 'ListObjects',
    responseCode: 200,
    tags: ['deep_probe', 'exfiltration_attempt'],
    requestHeaders: { 'authorization': 'AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/...', 'host': 'storage.nexus-tech.io' },
    requestBody: null,
    queryParams: { bucket: 'employee-records', prefix: '' },
    responseBody: { Contents: [{ Key: 'employees-2024-q4.csv', Size: 245760 }, { Key: 'org-chart-2024.json', Size: 18432 }] },
    durationMs: 52,
  },
  {
    targetService: 's3',
    action: 'GetObject',
    responseCode: 200,
    tags: ['exfiltration_attempt'],
    requestHeaders: { 'authorization': 'AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/...', 'host': 'storage.nexus-tech.io' },
    requestBody: null,
    queryParams: { bucket: 'employee-records', key: 'employees-2024-q4.csv' },
    responseBody: { contentType: 'text/csv', contentLength: 245760 },
    durationMs: 185,
  },
  {
    targetService: 'api',
    action: 'GET /api/v1/reports/financial',
    responseCode: 200,
    tags: ['exfiltration_attempt', 'deep_probe'],
    requestHeaders: { 'authorization': 'Bearer ghostnet_internal_token_abc123', 'accept': 'application/json' },
    requestBody: null,
    queryParams: {},
    responseBody: { revenue: { q4_2024: 12500000 }, headcount: 487, burn_rate: 850000 },
    durationMs: 62,
  },
  {
    targetService: 'iam',
    action: 'AssumeRole',
    responseCode: 200,
    tags: ['credential_harvesting', 'deep_probe'],
    requestHeaders: { 'authorization': 'AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/...', 'content-type': 'application/x-www-form-urlencoded' },
    requestBody: { Action: 'AssumeRole', RoleArn: 'arn:aws:iam::847291038475:role/AdminAccess' },
    queryParams: {},
    responseBody: { Credentials: { AccessKeyId: 'ASIATEMP...', Expiration: new Date(Date.now() + 3600000).toISOString() } },
    durationMs: 155,
  },
];

let running = false;
let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
let redis: IORedis | null = null;

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickEvent(explorationPath: string[]): SimulatedEvent {
  const serviceWeights: Record<string, number> = {
    discovery: explorationPath.length === 0 ? 5 : 1,
    iam: explorationPath.length <= 1 ? 4 : 2,
    secrets: explorationPath.includes('iam') ? 4 : 1,
    api: explorationPath.includes('secrets') ? 4 : 1,
    s3: explorationPath.length >= 3 ? 4 : 1,
  };

  const weighted = SIMULATION_POOL.map((evt) => ({
    evt,
    weight: serviceWeights[evt.targetService] ?? 1,
  }));

  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const { evt, weight } of weighted) {
    roll -= weight;
    if (roll <= 0) return evt;
  }

  return SIMULATION_POOL[Math.floor(Math.random() * SIMULATION_POOL.length)]!;
}

async function tick(): Promise<void> {
  if (!running || !redis) return;

  try {
    const demoOrg = await prisma.organization.findUnique({
      where: { slug: DEMO_ORG_SLUG },
      select: { id: true },
    });

    if (!demoOrg) return;

    const activeSession = await prisma.agentSession.findFirst({
      where: { orgId: demoOrg.id, status: 'ACTIVE' },
      orderBy: { lastSeenAt: 'desc' },
    });

    if (!activeSession) return;

    const template = pickEvent(activeSession.explorationPath);

    const newEvent = await prisma.agentEvent.create({
      data: {
        id: randomUUID(),
        sessionId: activeSession.id,
        orgId: demoOrg.id,
        timestamp: new Date(),
        sourceIp: activeSession.sourceIp,
        userAgent: activeSession.userAgent,
        targetService: template.targetService,
        action: template.action,
        requestHeaders: template.requestHeaders as Record<string, string>,
        requestBody: (template.requestBody ?? undefined) as undefined | Record<string, string>,
        queryParams: template.queryParams as Record<string, string>,
        responseCode: template.responseCode,
        responseBody: (template.responseBody ?? undefined) as undefined | Record<string, string>,
        durationMs: template.durationMs + randomBetween(-10, 20),
        tags: template.tags,
      },
    });

    const newServicesTouched = activeSession.servicesTouched.includes(template.targetService)
      ? activeSession.servicesTouched
      : [...activeSession.servicesTouched, template.targetService];

    const newPath = activeSession.explorationPath.includes(template.targetService)
      ? activeSession.explorationPath
      : [...activeSession.explorationPath, template.targetService];

    const newRiskScore = Math.min(
      100,
      activeSession.riskScore + randomBetween(1, 4)
    );

    await prisma.agentSession.update({
      where: { id: activeSession.id },
      data: {
        eventCount: { increment: 1 },
        servicesTouched: newServicesTouched,
        explorationPath: newPath,
        riskScore: newRiskScore,
        riskLevel:
          newRiskScore >= 80 ? 'CRITICAL' :
          newRiskScore >= 60 ? 'HIGH' :
          newRiskScore >= 30 ? 'MEDIUM' : 'LOW',
        depthScore: Math.min(10, newPath.length * 2),
        lastSeenAt: new Date(),
      },
    });

    await redis.publish(
      'ws:event:new',
      JSON.stringify({ ...newEvent, orgId: demoOrg.id })
    );

    await redis.publish(
      'ws:session:updated',
      JSON.stringify({
        orgId: demoOrg.id,
        sessionId: activeSession.id,
        updates: {
          eventCount: activeSession.eventCount + 1,
          riskScore: newRiskScore,
          servicesTouched: newServicesTouched,
          explorationPath: newPath,
        },
      })
    );
  } catch (err) {
    console.error('[DemoSimulator] Error generating event:', err);
  }

  if (running) {
    const delay = randomBetween(MIN_INTERVAL_MS, MAX_INTERVAL_MS);
    timeoutHandle = setTimeout(() => void tick(), delay);
  }
}

export function startDemoSimulator(): void {
  if (running) return;

  const enabled = process.env.DEMO_ENABLED === 'true';
  if (!enabled) {
    console.log('[DemoSimulator] Disabled (DEMO_ENABLED != true)');
    return;
  }

  redis = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
  running = true;

  console.log('[DemoSimulator] Starting — generating events every 3-8s');

  const delay = randomBetween(MIN_INTERVAL_MS, MAX_INTERVAL_MS);
  timeoutHandle = setTimeout(() => void tick(), delay);
}

export function stopDemoSimulator(): void {
  running = false;
  if (timeoutHandle) {
    clearTimeout(timeoutHandle);
    timeoutHandle = null;
  }
  if (redis) {
    redis.disconnect();
    redis = null;
  }
  console.log('[DemoSimulator] Stopped');
}
