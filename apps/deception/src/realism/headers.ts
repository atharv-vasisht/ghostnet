import crypto from 'node:crypto';
import type { FastifyInstance } from 'fastify';

type ServiceName = 'iam' | 'secrets' | 'api' | 'discovery';

function randomBase64(length: number): string {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
}

function getServiceHeaders(service: ServiceName): Record<string, string> {
  const requestId = crypto.randomUUID();

  switch (service) {
    case 'iam':
      return {
        'Server': 'AmazonEC2',
        'x-amzn-RequestId': requestId,
        'x-amz-id-2': randomBase64(60),
      };
    case 'secrets':
      return {
        'Server': 'Server',
        'x-amzn-RequestId': requestId,
        'x-amzn-Remapped-Content-Length': '0',
      };
    case 'api':
      return {
        'Server': 'nginx/1.24.0',
        'X-Request-Id': requestId,
        'X-RateLimit-Limit': '1000',
        'X-RateLimit-Remaining': String(Math.floor(Math.random() * 900 + 100)),
      };
    case 'discovery':
      return {
        'Server': 'nginx/1.24.0',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      };
  }
}

function resolveService(url: string): ServiceName | null {
  if (url.startsWith('/iam')) return 'iam';
  if (url.startsWith('/secrets')) return 'secrets';
  if (url.startsWith('/api/')) return 'api';
  if (url.startsWith('/.well-known')) return 'discovery';
  return null;
}

export async function headersPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('onSend', async (request, reply) => {
    const service = resolveService(request.url);
    if (!service) return;

    const headers = getServiceHeaders(service);
    for (const [key, value] of Object.entries(headers)) {
      void reply.header(key, value);
    }
  });
}
