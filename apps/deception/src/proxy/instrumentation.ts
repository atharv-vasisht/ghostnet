import crypto from 'node:crypto';
import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import type { RawEvent, TargetService } from '@ghostnet/shared';
import { publishEvent } from '../queue/producer.js';

const TARGET_SERVICE_MAP: Record<string, TargetService> = {
  '/iam': 'iam',
  '/secrets': 'secrets',
  '/api/v1': 'api',
  '/s3': 's3',
  '/oauth': 'oauth',
};

function hashUserAgent(ua: string | undefined): string {
  return crypto
    .createHash('sha256')
    .update(ua ?? 'unknown')
    .digest('hex')
    .slice(0, 16);
}

function extractTargetService(url: string): TargetService {
  for (const [prefix, service] of Object.entries(TARGET_SERVICE_MAP)) {
    if (url.startsWith(prefix)) return service;
  }
  return 'discovery';
}

function extractAction(request: FastifyRequest): string {
  const target = request.headers['x-amz-target'];
  if (typeof target === 'string') return target;

  const body = request.body as Record<string, unknown> | null;
  if (body && typeof body['Action'] === 'string') return body['Action'];

  return `${request.method} ${request.url.split('?')[0]}`;
}

function sanitizeHeaders(
  headers: Record<string, string | string[] | undefined>,
): Record<string, string> {
  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    const val = Array.isArray(value) ? value.join(', ') : value;
    sanitized[key] = val;
  }
  return sanitized;
}

function parseQueryParams(url: string): Record<string, string> {
  const idx = url.indexOf('?');
  if (idx === -1) return {};
  const params = new URLSearchParams(url.slice(idx));
  return Object.fromEntries(params.entries());
}

function safeJsonParse(payload: unknown): Record<string, unknown> | null {
  if (payload === null || payload === undefined) return null;
  if (typeof payload === 'object') return payload as Record<string, unknown>;
  if (typeof payload !== 'string') return null;
  try {
    const parsed: unknown = JSON.parse(payload);
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export const instrumentationPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onSend', async (request, reply, payload) => {
    if (request.url === '/health') return payload;

    const durationMs = Date.now() - request.captureStart;

    const event: RawEvent = {
      sessionKey: `${request.ip}:${hashUserAgent(request.headers['user-agent'])}`,
      orgId: process.env['ORG_ID'] ?? 'default',
      timestamp: new Date(),
      sourceIp: request.ip,
      userAgent: request.headers['user-agent'] ?? 'unknown',
      targetService: extractTargetService(request.url),
      action: extractAction(request),
      requestHeaders: sanitizeHeaders(request.headers),
      requestBody: (request.body as Record<string, unknown>) ?? null,
      queryParams: parseQueryParams(request.url),
      responseCode: reply.statusCode,
      responseBody: safeJsonParse(payload),
      durationMs,
    };

    publishEvent(event, request.deceptionTags).catch(() => {
      /* non-blocking — logged by producer */
    });

    return payload;
  });
};
