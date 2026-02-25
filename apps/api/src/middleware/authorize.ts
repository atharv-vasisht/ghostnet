import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Role } from '@prisma/client';

export function requireRole(...roles: Role[]) {
  return async function checkRole(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    if (!request.user || !roles.includes(request.user.role)) {
      reply
        .code(403)
        .send({ error: 'Forbidden', message: 'Insufficient permissions' });
    }
  };
}
