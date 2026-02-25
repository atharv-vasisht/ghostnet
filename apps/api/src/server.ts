import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { z } from 'zod';
import authPlugin from './plugins/auth.js';
import authRoutes from './routes/auth.js';
import sessionRoutes from './routes/sessions.js';
import eventRoutes from './routes/events.js';
import alertRoutes from './routes/alerts.js';
import configRoutes from './routes/config.js';
import userRoutes from './routes/users.js';
import orgRoutes from './routes/orgs.js';
import reportRoutes from './routes/reports.js';
import demoRoutes from './routes/demo.js';
import { prisma } from './services/auth.service.js';
import { setupWebSocket, closeWebSocket } from './websocket/gateway.js';
import { startDemoSimulator, stopDemoSimulator } from './services/demo-simulator.js';

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
  },
});

/* ── Plugins ── */

await app.register(cookie);
await app.register(cors, {
  origin: process.env.APP_URL ?? 'http://localhost:5173',
  credentials: true,
});
await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});
await app.register(authPlugin);

/* ── Global error handler ── */

app.setErrorHandler((error: Error & { statusCode?: number }, request, reply) => {
  if (error instanceof z.ZodError) {
    reply.code(400).send({
      error: 'Validation Error',
      message: 'Invalid request data',
      details: error.issues,
    });
    return;
  }

  const statusCode = error.statusCode ?? 500;

  if (statusCode === 429) {
    reply.code(429).send({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
    });
    return;
  }

  request.log.error(error);

  reply.code(statusCode).send({
    error: statusCode >= 500 ? 'Internal Server Error' : 'Request Error',
    message:
      process.env.NODE_ENV === 'production' && statusCode >= 500
        ? 'An unexpected error occurred'
        : error.message,
  });
});

/* ── Health check ── */

app.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  version: '1.0.0',
}));

/* ── Routes ── */

await app.register(authRoutes, { prefix: '/auth' });
await app.register(sessionRoutes, { prefix: '/api/sessions' });
await app.register(eventRoutes, { prefix: '/api/events' });
await app.register(alertRoutes, { prefix: '/api' });
await app.register(configRoutes, { prefix: '/api/config' });
await app.register(userRoutes, { prefix: '/api/users' });
await app.register(orgRoutes, { prefix: '/api/org' });
await app.register(reportRoutes, { prefix: '/api/reports' });
await app.register(demoRoutes, { prefix: '/api/demo' });

/* ── Start ── */

const port = parseInt(process.env.API_PORT ?? '3000', 10);

try {
  await app.listen({ port, host: '0.0.0.0' });
  app.log.info(`GHOSTNET API running on port ${port}`);

  const httpServer = app.server;
  if (httpServer) {
    setupWebSocket(httpServer);
    app.log.info('WebSocket gateway attached');
  }

  startDemoSimulator();
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

/* ── Graceful shutdown ── */

const shutdown = async (signal: string) => {
  app.log.info(`${signal} received — shutting down`);
  stopDemoSimulator();
  await closeWebSocket();
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
