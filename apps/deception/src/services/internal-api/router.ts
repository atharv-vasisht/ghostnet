import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { DeceptionData, DeceptionDataConfig } from '../../data/generator.js';
import { InternalApiData } from './data.js';
import { formatRestError } from '../../realism/errors.js';

const EXFILTRATION_PAGE_THRESHOLD = 3;

export function createInternalApiRouter(
  data: DeceptionData,
  config: DeceptionDataConfig,
) {
  return async function internalApiRouter(
    fastify: FastifyInstance,
  ): Promise<void> {
    const apiData = new InternalApiData(config, data);
    const pageTracker = new Map<string, Set<number>>();

    // ── Bearer token auth ────────────────────────────────────────

    fastify.addHook(
      'preHandler',
      async (request: FastifyRequest, reply: FastifyReply) => {
        const auth = request.headers.authorization;
        if (!auth || !auth.startsWith('Bearer ')) {
          return reply
            .code(401)
            .send(
              formatRestError(
                401,
                'Unauthorized',
                'Bearer token required. Obtain a valid token from the authentication service.',
              ),
            );
        }
      },
    );

    // ── Employees (paginated) ────────────────────────────────────

    fastify.get<{ Querystring: { page?: string; limit?: string } }>(
      '/employees',
      async (request, reply) => {
        const page = Math.max(1, Number(request.query.page) || 1);
        const limit = Number(request.query.limit) || 50;

        // Track pages per IP for exfiltration detection
        const ip = request.ip;
        const pages = pageTracker.get(ip) ?? new Set<number>();
        pages.add(page);
        pageTracker.set(ip, pages);

        if (pages.size > EXFILTRATION_PAGE_THRESHOLD) {
          request.deceptionTags.push('exfiltration_attempt');
        }

        const result = apiData.getEmployees(page, limit);
        return reply.send(result);
      },
    );

    // ── Single employee ──────────────────────────────────────────

    fastify.get<{ Params: { id: string } }>(
      '/employees/:id',
      async (request, reply) => {
        const employee = apiData.getEmployee(request.params.id);
        if (!employee) {
          return reply
            .code(404)
            .send(
              formatRestError(404, 'Not Found', 'Employee not found'),
            );
        }
        const { ssn: _ssn, ...safe } = employee;
        return reply.send({ data: safe });
      },
    );

    // ── Projects ─────────────────────────────────────────────────

    fastify.get('/projects', async (_request, reply) => {
      const projects = apiData.getActiveProjects();
      return reply.send({
        data: projects,
        total: projects.length,
      });
    });

    // ── Financial report ─────────────────────────────────────────

    fastify.get('/reports/financial', async (_request, reply) => {
      return reply.send({ data: apiData.getFinancialReport() });
    });

    // ── Headcount report ─────────────────────────────────────────

    fastify.get('/reports/headcount', async (_request, reply) => {
      return reply.send({ data: apiData.getHeadcountReport() });
    });

    // ── Admin config (breadcrumb to secrets) ─────────────────────

    fastify.get('/admin/config', async (_request, reply) => {
      return reply.send({ data: apiData.getAdminConfig() });
    });

    // ── Integrations ─────────────────────────────────────────────

    fastify.get('/integrations', async (_request, reply) => {
      return reply.send({ data: apiData.getIntegrations() });
    });
  };
}
