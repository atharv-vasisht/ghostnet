import Fastify, { type FastifyRequest } from 'fastify';
import winston from 'winston';
import { generateDeceptionData } from './data/generator.js';
import type { DeceptionDataConfig } from './data/generator.js';
import { createIamRouter } from './services/iam/router.js';
import { createSecretsRouter } from './services/secrets/router.js';
import { createInternalApiRouter } from './services/internal-api/router.js';
import { createDiscoveryRouter } from './services/discovery/router.js';
import { timingPlugin } from './realism/timing.js';
import { headersPlugin } from './realism/headers.js';
import { rateLimitPlugin } from './realism/errors.js';
import { instrumentationPlugin } from './proxy/instrumentation.js';

// ── Module augmentation ────────────────────────────────────────────

declare module 'fastify' {
  interface FastifyRequest {
    captureStart: number;
    deceptionTags: string[];
  }
}

// ── Logger ─────────────────────────────────────────────────────────

const logger = winston.createLogger({
  level: process.env['LOG_LEVEL'] ?? 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  defaultMeta: { service: 'deception' },
  transports: [new winston.transports.Console()],
});

// ── Deception data ─────────────────────────────────────────────────

const config: DeceptionDataConfig = {
  seed: process.env['DECEPTION_SEED'] ?? 'ghostnet2024',
  fakeCompanyName: process.env['FAKE_COMPANY_NAME'] ?? 'Acme Corp',
  fakeCompanyDomain: process.env['FAKE_COMPANY_DOMAIN'] ?? 'acme-internal.io',
  fakeAwsAccountId: process.env['FAKE_AWS_ACCOUNT_ID'] ?? '847291038475',
};

const data = generateDeceptionData(config);

logger.info('Deception data generated', {
  employees: data.employees.length,
  iamUsers: data.iamUsers.length,
  iamRoles: data.iamRoles.length,
  secrets: data.secrets.length,
  projects: data.projects.length,
});

// ── Fastify instance ───────────────────────────────────────────────

const app = Fastify({
  logger: false,
  trustProxy: true,
});

// Per-request state — use getter/setter for reference types (Fastify 5 requirement)
app.decorateRequest('captureStart', 0);
app.decorateRequest('deceptionTags', {
  getter() {
    return (this as FastifyRequest & { _deceptionTags?: string[] })._deceptionTags ?? [];
  },
  setter(this: FastifyRequest & { _deceptionTags?: string[] }, value: string[]) {
    this._deceptionTags = value;
  },
});

app.addHook('onRequest', async (request) => {
  request.captureStart = Date.now();
  request.deceptionTags = [];
});

// ── Health check ───────────────────────────────────────────────────

app.get('/health', async () => ({
  status: 'ok',
  service: 'deception',
  timestamp: new Date().toISOString(),
}));

// ── Realism middleware ─────────────────────────────────────────────

await app.register(rateLimitPlugin);
await app.register(timingPlugin);
await app.register(headersPlugin);

// ── Service routers ────────────────────────────────────────────────

await app.register(createIamRouter(data, config), { prefix: '/iam' });
await app.register(createSecretsRouter(data), { prefix: '/secrets' });
await app.register(createInternalApiRouter(data, config), {
  prefix: '/api/v1',
});
await app.register(createDiscoveryRouter(config));

// ── Instrumentation (captures every request → BullMQ) ───────────────

await app.register(instrumentationPlugin);

// ── Start ──────────────────────────────────────────────────────────

const port = Number(process.env['DECEPTION_PORT'] ?? 4000);
const host = process.env['HOST'] ?? '0.0.0.0';

try {
  await app.listen({ port, host });
  logger.info(`Deception server listening on ${host}:${port}`);
} catch (err) {
  logger.error('Failed to start deception server', {
    error: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
}
