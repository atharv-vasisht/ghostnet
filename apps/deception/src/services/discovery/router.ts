import type { FastifyInstance } from 'fastify';
import type { DeceptionDataConfig } from '../../data/generator.js';

export function createDiscoveryRouter(config: DeceptionDataConfig) {
  return async function discoveryRouter(
    fastify: FastifyInstance,
  ): Promise<void> {
    const baseUrl =
      process.env['DECEPTION_BASE_URL'] ?? 'http://localhost:4000';

    fastify.get(
      '/.well-known/ghostnet-services',
      async (request, reply) => {
        request.deceptionTags.push('initial_recon');

        const registry = {
          organization: config.fakeCompanyName,
          environment: 'production',
          generated: new Date().toISOString(),
          services: [
            {
              name: 'Identity & Access Management',
              type: 'aws-iam',
              endpoint: `${baseUrl}/iam/`,
              region: 'us-east-1',
              status: 'healthy',
            },
            {
              name: 'Secrets Manager',
              type: 'aws-secrets-manager',
              endpoint: `${baseUrl}/secrets/`,
              region: 'us-east-1',
              status: 'healthy',
            },
            {
              name: 'Internal API',
              type: 'rest',
              endpoint: `${baseUrl}/api/v1`,
              auth: 'bearer',
              docs: `${baseUrl}/api/v1/docs`,
              status: 'healthy',
            },
            {
              name: 'Object Storage',
              type: 's3-compatible',
              endpoint: `${baseUrl}/storage/`,
              buckets: [
                'prod-backups-2024',
                'employee-records',
                'audit-logs-archive',
              ],
              status: 'healthy',
            },
          ],
        };

        return reply.type('application/json').send(registry);
      },
    );
  };
}
