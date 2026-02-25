import crypto from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import type { DeceptionData } from '../../data/generator.js';
import { SecretVault } from './vault.js';
import { formatAwsJsonError } from '../../realism/errors.js';

export function createSecretsRouter(data: DeceptionData) {
  return async function secretsRouter(fastify: FastifyInstance): Promise<void> {
    const vault = new SecretVault(data);

    fastify.addContentTypeParser(
      'application/x-amz-json-1.1',
      { parseAs: 'string' },
      (_request, body, done) => {
        try {
          const parsed: unknown = JSON.parse(String(body));
          done(null, parsed);
        } catch {
          done(null, {});
        }
      },
    );

    fastify.post<{ Body: Record<string, unknown> }>(
      '/',
      async (request, reply) => {
        const target = request.headers['x-amz-target'];
        const requestId = crypto.randomUUID();

        void reply
          .type('application/x-amz-json-1.1')
          .header('x-amzn-RequestId', requestId);

        if (typeof target !== 'string') {
          return reply
            .code(400)
            .send(
              formatAwsJsonError(
                'MissingTargetException',
                'X-Amz-Target header is required',
              ),
            );
        }

        switch (target) {
          case 'secretsmanager.ListSecrets': {
            const secrets = vault.listSecrets();
            return reply.send({ SecretList: secrets });
          }

          case 'secretsmanager.GetSecretValue': {
            const secretId = request.body['SecretId'];
            if (typeof secretId !== 'string') {
              return reply
                .code(400)
                .send(
                  formatAwsJsonError(
                    'InvalidParameterException',
                    'SecretId is required',
                  ),
                );
            }

            const value = vault.getSecretValue(secretId);
            if (!value) {
              return reply
                .code(404)
                .send(
                  formatAwsJsonError(
                    'ResourceNotFoundException',
                    `Secrets Manager can't find the specified secret: ${secretId}`,
                  ),
                );
            }

            request.deceptionTags.push('credential_harvesting');
            return reply.send(value);
          }

          case 'secretsmanager.DescribeSecret': {
            const secretId = request.body['SecretId'];
            if (typeof secretId !== 'string') {
              return reply
                .code(400)
                .send(
                  formatAwsJsonError(
                    'InvalidParameterException',
                    'SecretId is required',
                  ),
                );
            }

            const desc = vault.describeSecret(secretId);
            if (!desc) {
              return reply
                .code(404)
                .send(
                  formatAwsJsonError(
                    'ResourceNotFoundException',
                    `Secrets Manager can't find the specified secret: ${secretId}`,
                  ),
                );
            }
            return reply.send(desc);
          }

          default:
            return reply
              .code(400)
              .send(
                formatAwsJsonError(
                  'InvalidRequestException',
                  `Unknown target: ${target}`,
                ),
              );
        }
      },
    );
  };
}
