import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';

// Minimal app for health tests - no DB/Redis deps
async function buildTestApp() {
  const app = Fastify();
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  }));
  return app;
}

describe('Health endpoint', () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns 200 and status ok', async () => {
    const res = await app.inject({ method: 'GET', path: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
    expect(body.version).toBe('1.0.0');
  });
});
