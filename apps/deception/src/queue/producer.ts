import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import type { RawEvent } from '@ghostnet/shared';

const connection = new IORedis(process.env['REDIS_URL'] ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const eventQueue = new Queue('events', { connection });

export async function publishEvent(
  event: RawEvent,
  tags: string[] = [],
): Promise<void> {
  await eventQueue.add(
    'raw-event',
    { ...event, tags },
    {
      removeOnComplete: true,
      removeOnFail: 100,
    },
  );
}
