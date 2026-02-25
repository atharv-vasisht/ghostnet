import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import IORedis from 'ioredis';
import { prisma, verifyAccessToken } from '../services/auth.service.js';

interface SocketData {
  orgId: string | null;
  isDemo: boolean;
  userId?: string;
}

const APP_URL = process.env.APP_URL ?? 'http://localhost:5173';
const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
const DEMO_ORG_SLUG = process.env.DEMO_ORG_SLUG ?? 'demo';

const DEMO_ROOM = 'org:demo';

type IoServer = Server<
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  SocketData
>;

let ioInstance: IoServer | null = null;
let redisSubInstance: IORedis | null = null;

interface RedisWsPayload {
  orgId?: string;
  event?: { orgId?: string };
  session?: { orgId?: string };
  alert?: { orgId?: string };
  belief?: { orgId?: string };
}

async function getDemoOrgId(): Promise<string | null> {
  const org = await prisma.organization.findUnique({
    where: { slug: DEMO_ORG_SLUG },
    select: { id: true },
  });
  return org?.id ?? null;
}

function extractToken(socket: {
  handshake: {
    auth?: { token?: string };
    headers?: Record<string, string | string[] | undefined>;
  };
}): string | null {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === 'string' && authToken.length > 0) {
    return authToken;
  }
  const authHeader = socket.handshake.headers?.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}

function extractOrgIdFromPayload(payload: RedisWsPayload): string | null {
  if (payload.orgId && typeof payload.orgId === 'string') {
    return payload.orgId;
  }
  if (payload.event?.orgId && typeof payload.event.orgId === 'string') {
    return payload.event.orgId;
  }
  if (payload.session?.orgId && typeof payload.session.orgId === 'string') {
    return payload.session.orgId;
  }
  if (payload.alert?.orgId && typeof payload.alert.orgId === 'string') {
    return payload.alert.orgId;
  }
  if (payload.belief?.orgId && typeof payload.belief.orgId === 'string') {
    return payload.belief.orgId;
  }
  return null;
}

export function setupWebSocket(server: HttpServer): IoServer {
  const io = new Server<
    Record<string, never>,
    Record<string, never>,
    Record<string, never>,
    SocketData
  >(server, {
    cors: {
      origin: APP_URL,
      credentials: true,
    },
    path: '/socket.io',
  });

  const redisSub = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
  redisSubInstance = redisSub;

  const channelMap: Record<string, string> = {
    'ws:session:new': 'session:new',
    'ws:session:updated': 'session:updated',
    'ws:event:new': 'event:new',
    'ws:alert:fired': 'alert:fired',
    'ws:belief:updated': 'belief:updated',
  };

  for (const [redisChannel, emitEvent] of Object.entries(channelMap)) {
    redisSub.subscribe(redisChannel, (err) => {
      if (err) {
        console.error(`[WebSocket] Failed to subscribe to ${redisChannel}:`, err);
      }
    });
  }

  redisSub.on('message', (channel: string, message: string) => {
    const emitEvent = channelMap[channel];
    if (!emitEvent) return;

    let payload: RedisWsPayload;
    try {
      payload = JSON.parse(message) as RedisWsPayload;
    } catch {
      console.error(`[WebSocket] Invalid JSON on ${channel}`);
      return;
    }

    const orgId = extractOrgIdFromPayload(payload);
    if (!orgId) {
      console.warn(`[WebSocket] No orgId in payload on ${channel}, skipping`);
      return;
    }

    const room = `org:${orgId}`;
    io.to(room).emit(emitEvent, payload);
  });

  redisSub.on('error', (err) => {
    console.error('[WebSocket] Redis subscriber error:', err);
  });

  io.use(async (socket, next) => {
    const token = extractToken(socket);
    const isDemoConnection = !token;

    if (isDemoConnection) {
      socket.data.orgId = null;
      socket.data.isDemo = true;
      next();
      return;
    }

    try {
      const decoded = verifyAccessToken(token);
      socket.data.orgId = decoded.orgId;
      socket.data.isDemo = false;
      socket.data.userId = decoded.userId;
      next();
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('JWT verification failed');
      next(error);
    }
  });

  io.on('connection', async (socket) => {
    const { orgId, isDemo } = socket.data;

    let room: string;
    if (isDemo || (orgId && (await getDemoOrgId()) === orgId)) {
      room = DEMO_ROOM;
    } else if (orgId) {
      room = `org:${orgId}`;
    } else {
      room = DEMO_ROOM;
    }

    socket.join(room);
    console.log(`[WebSocket] socket ${socket.id} connected, joined ${room}`);

    socket.on('disconnect', (reason) => {
      console.log(`[WebSocket] socket ${socket.id} disconnected: ${reason}`);
    });
  });

  ioInstance = io;
  return io;
}

export function getIo(): IoServer | null {
  return ioInstance;
}

export async function closeWebSocket(): Promise<void> {
  if (ioInstance) {
    ioInstance.close();
    ioInstance = null;
  }
  if (redisSubInstance) {
    await redisSubInstance.quit();
    redisSubInstance = null;
  }
}
