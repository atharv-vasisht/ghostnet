import type { FastifyRequest, FastifyReply } from 'fastify';

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  await request.server.authenticate(request, reply);
}
