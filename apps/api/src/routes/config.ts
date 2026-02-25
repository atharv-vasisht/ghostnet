import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';
import { prisma } from '../services/auth.service.js';

const DECEPTION_BASE_URL =
  process.env.DECEPTION_BASE_URL ?? 'http://localhost:4000';

const updateConfigSchema = z.object({
  iamEnabled: z.boolean().optional(),
  oauthEnabled: z.boolean().optional(),
  apiEnabled: z.boolean().optional(),
  secretsEnabled: z.boolean().optional(),
  s3Enabled: z.boolean().optional(),
  discoveryEnabled: z.boolean().optional(),
  lureDepth: z.number().int().min(1).max(5).optional(),
  rateLimitEnabled: z.boolean().optional(),
});

function computeEndpoints(slug: string) {
  return {
    iam: `${DECEPTION_BASE_URL}/iam/${slug}`,
    oauth: `${DECEPTION_BASE_URL}/oauth/${slug}`,
    api: `${DECEPTION_BASE_URL}/api/${slug}`,
    secrets: `${DECEPTION_BASE_URL}/secrets/${slug}`,
    s3: `${DECEPTION_BASE_URL}/s3/${slug}`,
    discovery: `${DECEPTION_BASE_URL}/${slug}/.well-known/ghostnet-services`,
  };
}

export default async function configRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  fastify.addHook('preHandler', requireAuth);

  fastify.get('/', async (request) => {
    const user = request.user!;

    let config = await prisma.deceptionConfig.findUnique({
      where: { orgId: user.orgId },
    });

    if (!config) {
      config = await prisma.deceptionConfig.create({
        data: { orgId: user.orgId },
      });
    }

    const org = await prisma.organization.findUniqueOrThrow({
      where: { id: user.orgId },
      select: { slug: true },
    });

    return { config, endpoints: computeEndpoints(org.slug) };
  });

  fastify.patch(
    '/',
    { preHandler: [requireRole('ADMIN')] },
    async (request) => {
      const user = request.user!;
      const body = updateConfigSchema.parse(request.body);

      const config = await prisma.deceptionConfig.upsert({
        where: { orgId: user.orgId },
        update: body,
        create: { orgId: user.orgId, ...body },
      });

      return { config };
    },
  );

  fastify.get('/endpoints', async (request) => {
    const user = request.user!;

    const org = await prisma.organization.findUniqueOrThrow({
      where: { id: user.orgId },
      select: { slug: true },
    });

    const config = await prisma.deceptionConfig.findUnique({
      where: { orgId: user.orgId },
    });

    const all = computeEndpoints(org.slug);
    const endpoints: Record<string, string> = {};

    if (config?.iamEnabled ?? true) endpoints.iam = all.iam;
    if (config?.oauthEnabled ?? true) endpoints.oauth = all.oauth;
    if (config?.apiEnabled ?? true) endpoints.api = all.api;
    if (config?.secretsEnabled ?? true) endpoints.secrets = all.secrets;
    if (config?.s3Enabled ?? true) endpoints.s3 = all.s3;
    if (config?.discoveryEnabled ?? true) endpoints.discovery = all.discovery;

    return { endpoints };
  });
}
