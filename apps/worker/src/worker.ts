import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import winston from 'winston';
import { processEvent } from './processors/event.processor.js';

const logger = winston.createLogger({
  level: process.env['LOG_LEVEL'] ?? 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  defaultMeta: { service: 'worker' },
  transports: [new winston.transports.Console()],
});

const connection = new IORedis(process.env['REDIS_URL'] ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  'events',
  async (job) => {
    const start = Date.now();
    try {
      await processEvent(job.data as Record<string, unknown>, logger);
      logger.info('event_processed', {
        jobId: job.id,
        durationMs: Date.now() - start,
      });
    } catch (err) {
      logger.error('event_processing_failed', {
        jobId: job.id,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start,
      });
      throw err;
    }
  },
  {
    connection,
    concurrency: 10,
  },
);

worker.on('error', (err) => {
  logger.error('worker_error', { error: err.message });
});

logger.info('Worker started, listening on queue "events"');

async function shutdown(): Promise<void> {
  logger.info('Graceful shutdown initiated');
  await worker.close();
  connection.disconnect();
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown());
process.on('SIGINT', () => void shutdown());
