import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';
import { prisma } from '../services/auth.service.js';

const ORG_SELECT = {
  id: true,
  name: true,
  slug: true,
  plan: true,
  isDemo: true,
  fakeCompanyName: true,
  fakeCompanyDomain: true,
  fakeAwsAccountId: true,
  deceptionSeed: true,
  createdAt: true,
} as const;

const updateOrgSchema = z.object({
  name: z.string().min(1).optional(),
  fakeCompanyName: z.string().min(1).optional(),
  fakeCompanyDomain: z.string().min(1).optional(),
  fakeAwsAccountId: z.string().regex(/^\d{12}$/, 'Must be a 12-digit number').optional(),
  deceptionSeed: z.string().min(1).optional(),
});

export default async function orgRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  fastify.addHook('preHandler', requireAuth);

  fastify.get('/', async (request) => {
    const user = request.user!;

    return prisma.organization.findUniqueOrThrow({
      where: { id: user.orgId },
      select: ORG_SELECT,
    });
  });

  fastify.patch(
    '/',
    { preHandler: [requireRole('ADMIN')] },
    async (request) => {
      const user = request.user!;
      const body = updateOrgSchema.parse(request.body);

      return prisma.organization.update({
        where: { id: user.orgId },
        data: body,
        select: ORG_SELECT,
      });
    },
  );
}
