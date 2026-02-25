import crypto from 'node:crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 100;

// ── AWS XML error formatting ───────────────────────────────────────

export function formatAwsXmlError(
  code: string,
  message: string,
  requestId?: string,
): string {
  const reqId = requestId ?? crypto.randomUUID();
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<ErrorResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">',
    '  <Error>',
    '    <Type>Sender</Type>',
    `    <Code>${code}</Code>`,
    `    <Message>${message}</Message>`,
    '  </Error>',
    `  <RequestId>${reqId}</RequestId>`,
    '</ErrorResponse>',
  ].join('\n');
}

// ── AWS JSON error formatting ──────────────────────────────────────

export interface AwsJsonError {
  __type: string;
  message: string;
}

export function formatAwsJsonError(type: string, message: string): AwsJsonError {
  return { __type: type, message };
}

// ── REST JSON error formatting ─────────────────────────────────────

export interface RestJsonError {
  error: string;
  message: string;
  statusCode: number;
}

export function formatRestError(
  statusCode: number,
  error: string,
  message: string,
): RestJsonError {
  return { error, message, statusCode };
}

// ── AccessDeniedException (XML) ────────────────────────────────────

export function formatAccessDeniedXml(message: string, requestId?: string): string {
  return formatAwsXmlError('AccessDenied', message, requestId);
}

// ── AccessDeniedException (JSON) ───────────────────────────────────

export function formatAccessDeniedJson(message: string): AwsJsonError {
  return formatAwsJsonError('AccessDeniedException', message);
}

// ── Error format resolution ────────────────────────────────────────

type ErrorFormat = 'xml' | 'aws-json' | 'rest-json';

function resolveErrorFormat(url: string): ErrorFormat {
  if (url.startsWith('/iam')) return 'xml';
  if (url.startsWith('/secrets')) return 'aws-json';
  return 'rest-json';
}

function sendThrottleResponse(reply: FastifyReply, format: ErrorFormat): void {
  switch (format) {
    case 'xml':
      void reply
        .code(429)
        .type('text/xml;charset=UTF-8')
        .header('X-Amzn-ErrorType', 'Throttling')
        .send(formatAwsXmlError('Throttling', 'Rate exceeded'));
      break;
    case 'aws-json':
      void reply
        .code(429)
        .type('application/x-amz-json-1.1')
        .header('X-Amzn-ErrorType', 'ThrottlingException')
        .send(formatAwsJsonError('ThrottlingException', 'Rate exceeded'));
      break;
    case 'rest-json':
      void reply
        .code(429)
        .type('application/json')
        .send(formatRestError(429, 'Too Many Requests', 'Rate limit exceeded. Try again later.'));
      break;
  }
}

// ── Rate-limit plugin ──────────────────────────────────────────────

export async function rateLimitPlugin(fastify: FastifyInstance): Promise<void> {
  const requestLog = new Map<string, number[]>();

  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of requestLog) {
      const active = timestamps.filter((t) => now - t < RATE_WINDOW_MS);
      if (active.length === 0) {
        requestLog.delete(ip);
      } else {
        requestLog.set(ip, active);
      }
    }
  }, RATE_WINDOW_MS);

  fastify.addHook('onClose', async () => {
    clearInterval(cleanupInterval);
  });

  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.url === '/health') return;

    const ip = request.ip;
    const now = Date.now();
    const timestamps = (requestLog.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
    timestamps.push(now);
    requestLog.set(ip, timestamps);

    if (timestamps.length <= RATE_LIMIT) return;

    const format = resolveErrorFormat(request.url);
    sendThrottleResponse(reply, format);
  });
}
