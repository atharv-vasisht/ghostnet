import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { RiskLevel, AlertTrigger } from '@prisma/client';
import { requireAuth } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';
import {
  listAlerts,
  acknowledgeAlert,
  listAlertRules,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
} from '../services/alert.service.js';

const alertListQuerySchema = z.object({
  acknowledged: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  severity: z.nativeEnum(RiskLevel).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
});

const idParamsSchema = z.object({ id: z.string().uuid() });

const createAlertRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  enabled: z.boolean().default(true),
  trigger: z.nativeEnum(AlertTrigger),
  threshold: z.number().int().positive().optional(),
  services: z.array(z.string()),
  notifyInApp: z.boolean().default(true),
  notifyEmail: z.boolean().default(false),
  notifySlack: z.boolean().default(false),
  slackWebhook: z.string().url().optional(),
  webhookUrl: z.string().url().optional(),
});

const updateAlertRuleSchema = createAlertRuleSchema.partial();

export default async function alertRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  fastify.addHook('preHandler', requireAuth);

  /* ── Alerts ── */

  fastify.get('/alerts', async (request) => {
    const user = request.user!;
    const query = alertListQuerySchema.parse(request.query);

    return listAlerts({
      orgId: user.orgId,
      acknowledged: query.acknowledged,
      severity: query.severity,
      page: query.page,
      limit: query.limit,
    });
  });

  fastify.patch('/alerts/:id/acknowledge', async (request, reply) => {
    const user = request.user!;
    const { id } = idParamsSchema.parse(request.params);

    const alert = await acknowledgeAlert(id, user.orgId);
    if (!alert) {
      reply
        .code(404)
        .send({ error: 'Not Found', message: 'Alert not found' });
      return;
    }

    return alert;
  });

  /* ── Alert Rules ── */

  fastify.get('/alert-rules', async (request) => {
    const user = request.user!;
    return listAlertRules(user.orgId);
  });

  fastify.post(
    '/alert-rules',
    { preHandler: [requireRole('ADMIN')] },
    async (request, reply) => {
      const user = request.user!;
      const body = createAlertRuleSchema.parse(request.body);

      const rule = await createAlertRule({ ...body, orgId: user.orgId });
      reply.code(201);
      return rule;
    },
  );

  fastify.patch(
    '/alert-rules/:id',
    { preHandler: [requireRole('ADMIN')] },
    async (request, reply) => {
      const user = request.user!;
      const { id } = idParamsSchema.parse(request.params);
      const body = updateAlertRuleSchema.parse(request.body);

      const rule = await updateAlertRule(id, user.orgId, body);
      if (!rule) {
        reply
          .code(404)
          .send({ error: 'Not Found', message: 'Alert rule not found' });
        return;
      }

      return rule;
    },
  );

  fastify.delete(
    '/alert-rules/:id',
    { preHandler: [requireRole('ADMIN')] },
    async (request, reply) => {
      const user = request.user!;
      const { id } = idParamsSchema.parse(request.params);

      const result = await deleteAlertRule(id, user.orgId);
      if (!result) {
        reply
          .code(404)
          .send({ error: 'Not Found', message: 'Alert rule not found' });
        return;
      }

      reply.code(204).send();
    },
  );
}
