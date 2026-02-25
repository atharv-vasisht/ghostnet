import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { Role } from '@prisma/client';
import { requireAuth } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';
import { prisma } from '../services/auth.service.js';
import { sendInviteEmail } from '../services/email.service.js';

const APP_URL = process.env.APP_URL ?? 'http://localhost:5173';

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(Role),
});

const changeRoleSchema = z.object({
  role: z.nativeEnum(Role),
});

const idParamsSchema = z.object({ id: z.string().uuid() });

export default async function userRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  fastify.addHook('preHandler', requireAuth);

  fastify.get('/', async (request) => {
    const user = request.user!;

    const users = await prisma.user.findMany({
      where: { orgId: user.orgId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return { users };
  });

  fastify.post(
    '/invite',
    { preHandler: [requireRole('ADMIN')] },
    async (request, reply) => {
      const user = request.user!;
      const body = inviteSchema.parse(request.body);

      const existingUser = await prisma.user.findUnique({
        where: { email: body.email },
      });
      if (existingUser) {
        reply
          .code(409)
          .send({ error: 'Conflict', message: 'User already exists' });
        return;
      }

      const existingInvite = await prisma.invite.findFirst({
        where: {
          email: body.email,
          orgId: user.orgId,
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
      });
      if (existingInvite) {
        reply.code(409).send({
          error: 'Conflict',
          message: 'An active invite already exists for this email',
        });
        return;
      }

      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const invite = await prisma.invite.create({
        data: {
          email: body.email,
          role: body.role,
          token,
          orgId: user.orgId,
          expiresAt,
        },
      });

      const inviter = await prisma.user.findUniqueOrThrow({
        where: { id: user.userId },
        select: { name: true },
      });
      const org = await prisma.organization.findUniqueOrThrow({
        where: { id: user.orgId },
        select: { name: true },
      });

      const inviteUrl = `${APP_URL}/signup?invite=${token}`;
      await sendInviteEmail(
        body.email,
        inviter.name,
        org.name,
        body.role,
        inviteUrl,
      ).catch(() => {
        /* non-critical */
      });

      reply.code(201);
      return {
        invite: {
          id: invite.id,
          email: invite.email,
          role: invite.role,
          expiresAt: invite.expiresAt,
        },
      };
    },
  );

  fastify.patch(
    '/:id/role',
    { preHandler: [requireRole('ADMIN')] },
    async (request, reply) => {
      const currentUser = request.user!;
      const { id } = idParamsSchema.parse(request.params);
      const body = changeRoleSchema.parse(request.body);

      if (id === currentUser.userId) {
        reply
          .code(400)
          .send({
            error: 'Bad Request',
            message: 'Cannot change your own role',
          });
        return;
      }

      const targetUser = await prisma.user.findUnique({ where: { id } });
      if (!targetUser || targetUser.orgId !== currentUser.orgId) {
        reply
          .code(404)
          .send({ error: 'Not Found', message: 'User not found' });
        return;
      }

      if (targetUser.role === 'ADMIN' && body.role !== 'ADMIN') {
        const adminCount = await prisma.user.count({
          where: { orgId: currentUser.orgId, role: 'ADMIN' },
        });
        if (adminCount <= 1) {
          reply.code(400).send({
            error: 'Bad Request',
            message: 'Cannot remove the last admin',
          });
          return;
        }
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { role: body.role },
        select: { id: true, email: true, name: true, role: true },
      });

      return { user: updated };
    },
  );

  fastify.delete(
    '/:id',
    { preHandler: [requireRole('ADMIN')] },
    async (request, reply) => {
      const currentUser = request.user!;
      const { id } = idParamsSchema.parse(request.params);

      if (id === currentUser.userId) {
        reply
          .code(400)
          .send({ error: 'Bad Request', message: 'Cannot remove yourself' });
        return;
      }

      const targetUser = await prisma.user.findUnique({ where: { id } });
      if (!targetUser || targetUser.orgId !== currentUser.orgId) {
        reply
          .code(404)
          .send({ error: 'Not Found', message: 'User not found' });
        return;
      }

      if (targetUser.role === 'ADMIN') {
        const adminCount = await prisma.user.count({
          where: { orgId: currentUser.orgId, role: 'ADMIN' },
        });
        if (adminCount <= 1) {
          reply.code(400).send({
            error: 'Bad Request',
            message: 'Cannot remove the last admin',
          });
          return;
        }
      }

      await prisma.$transaction([
        prisma.refreshToken.deleteMany({ where: { userId: id } }),
        prisma.user.delete({ where: { id } }),
      ]);

      reply.code(204).send();
    },
  );
}
