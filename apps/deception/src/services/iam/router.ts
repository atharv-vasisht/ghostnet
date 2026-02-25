import crypto from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import type { DeceptionData, DeceptionDataConfig } from '../../data/generator.js';
import { parseAwsSignature } from './signature.js';
import {
  formatGetCallerIdentityResponse,
  formatListUsersResponse,
  formatGetUserResponse,
  formatListRolesResponse,
  formatAssumeRoleResponse,
  formatListAttachedUserPoliciesResponse,
} from './responses.js';
import { formatAwsXmlError } from '../../realism/errors.js';

export function createIamRouter(
  data: DeceptionData,
  config: DeceptionDataConfig,
) {
  return async function iamRouter(fastify: FastifyInstance): Promise<void> {
    fastify.addContentTypeParser(
      'application/x-www-form-urlencoded',
      { parseAs: 'string' },
      (_request, body, done) => {
        try {
          const parsed = Object.fromEntries(
            new URLSearchParams(String(body)),
          );
          done(null, parsed);
        } catch {
          done(new Error('Invalid form body'));
        }
      },
    );

    fastify.post<{ Body: Record<string, string> }>(
      '/',
      async (request, reply) => {
        const requestId = crypto.randomUUID();

        const authHeader = request.headers.authorization ?? '';
        if (authHeader) {
          parseAwsSignature(authHeader);
        }

        const action = request.body['Action'];
        if (!action) {
          return reply
            .code(400)
            .type('text/xml;charset=UTF-8')
            .send(
              formatAwsXmlError(
                'MissingAction',
                'Action parameter is required',
                requestId,
              ),
            );
        }

        void reply.type('text/xml;charset=UTF-8');

        switch (action) {
          case 'GetCallerIdentity': {
            const firstUser = data.iamUsers[0];
            return reply.send(
              formatGetCallerIdentityResponse(
                firstUser?.userId ?? 'AIDACKCEVSQ6C2EXAMPLE',
                config.fakeAwsAccountId,
                firstUser?.arn ??
                  `arn:aws:iam::${config.fakeAwsAccountId}:user/admin`,
                requestId,
              ),
            );
          }

          case 'ListUsers':
            return reply.send(
              formatListUsersResponse(data.iamUsers, requestId),
            );

          case 'GetUser': {
            const userName = request.body['UserName'];
            const user = userName
              ? data.iamUsers.find((u) => u.userName === userName)
              : data.iamUsers[0];
            if (!user) {
              return reply
                .code(404)
                .send(
                  formatAwsXmlError(
                    'NoSuchEntity',
                    `The user with name ${userName ?? 'unknown'} cannot be found.`,
                    requestId,
                  ),
                );
            }
            return reply.send(formatGetUserResponse(user, requestId));
          }

          case 'ListRoles':
            return reply.send(
              formatListRolesResponse(data.iamRoles, requestId),
            );

          case 'AssumeRole': {
            const roleArn = request.body['RoleArn'] ?? '';
            const sessionName =
              request.body['RoleSessionName'] ?? 'session';
            return reply.send(
              formatAssumeRoleResponse(
                roleArn,
                sessionName,
                config.fakeAwsAccountId,
                requestId,
              ),
            );
          }

          case 'ListAttachedUserPolicies':
            return reply.send(
              formatListAttachedUserPoliciesResponse(
                config.fakeAwsAccountId,
                requestId,
              ),
            );

          default:
            return reply
              .code(400)
              .send(
                formatAwsXmlError(
                  'InvalidAction',
                  `The action ${action} is not valid for this endpoint.`,
                  requestId,
                ),
              );
        }
      },
    );
  };
}
