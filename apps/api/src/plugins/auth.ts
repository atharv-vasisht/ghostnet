import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import type { Role } from '@prisma/client';
import { verifyAccessToken } from '../services/auth.service.js';
import type { TokenPayload } from '../services/auth.service.js';

declare module 'fastify' {
  interface FastifyRequest {
    user: TokenPayload | null;
  }
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }
}

export type { TokenPayload };
export type { Role };

async function authPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.decorateRequest('user', null);

  fastify.decorate(
    'authenticate',
    async function (
      request: FastifyRequest,
      reply: FastifyReply,
    ): Promise<void> {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        reply
          .code(401)
          .send({
            error: 'Unauthorized',
            message: 'Valid authentication required',
          });
        return;
      }

      const token = authHeader.slice(7);
      try {
        request.user = verifyAccessToken(token);
      } catch {
        reply
          .code(401)
          .send({
            error: 'Unauthorized',
            message: 'Valid authentication required',
          });
      }
    },
  );
}

export default fp(authPlugin, { name: 'ghostnet-auth' });
