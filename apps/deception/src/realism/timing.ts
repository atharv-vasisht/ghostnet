import type { FastifyInstance } from 'fastify';

type ServiceName = 'iam' | 'secrets' | 'api' | 's3' | 'discovery';

interface TimingRange {
  min: number;
  max: number;
}

const SERVICE_TIMING: Record<ServiceName, TimingRange> = {
  iam: { min: 80, max: 220 },
  secrets: { min: 60, max: 180 },
  api: { min: 40, max: 150 },
  s3: { min: 30, max: 120 },
  discovery: { min: 20, max: 80 },
};

function resolveService(url: string): ServiceName | null {
  if (url.startsWith('/iam')) return 'iam';
  if (url.startsWith('/secrets')) return 'secrets';
  if (url.startsWith('/api/')) return 'api';
  if (url.startsWith('/.well-known')) return 'discovery';
  return null;
}

function randomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function timingPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('preHandler', async (request) => {
    const service = resolveService(request.url);
    if (!service) return;

    const range = SERVICE_TIMING[service];
    const ms = randomDelay(range.min, range.max);
    await new Promise<void>((resolve) => setTimeout(resolve, ms));
  });
}
