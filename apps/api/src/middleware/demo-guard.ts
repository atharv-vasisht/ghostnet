import type { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../services/auth.service.js';

export async function blockDemoMutations(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (request.method === 'GET') return;
  if (!request.user) return;

  const org = await prisma.organization.findUnique({
    where: { id: request.user.orgId },
    select: { isDemo: true },
  });

  if (org?.isDemo) {
    reply.code(403).send({
      error: 'Demo Mode',
      message:
        'This action is not available in demo mode. Sign up for a free account to get started.',
    });
  }
}
