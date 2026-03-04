import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  prisma,
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  comparePassword,
  generateResetToken,
  validateResetToken,
} from '../services/auth.service.js';
import {
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from '../services/email.service.js';
import { requireAuth } from '../middleware/authenticate.js';

/* ── Zod Schemas ── */

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  inviteToken: z.string().uuid(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().uuid(),
  password: z.string().min(8),
});

/* ── Cookie config ── */

const REFRESH_COOKIE = 'ghostnet_refresh';
const COOKIE_PATH = '/auth/refresh';

function refreshCookieOptions() {
  return {
    httpOnly: true,
    path: COOKIE_PATH,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days (seconds)
  };
}

/* ── Routes ── */

export default async function authRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  /* ── POST /auth/signup ── */
  fastify.post('/signup', async (request, reply) => {
    const body = signupSchema.parse(request.body);

    const invite = await prisma.invite.findUnique({
      where: { token: body.inviteToken },
    });

    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
      reply
        .code(400)
        .send({
          error: 'Invalid invite',
          message: 'Invite token is invalid or expired',
        });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });
    if (existingUser) {
      reply
        .code(409)
        .send({ error: 'Conflict', message: 'Email already registered' });
      return;
    }

    const passwordHash = await hashPassword(body.password);

    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        name: body.name,
        role: invite.role,
        orgId: invite.orgId,
      },
    });

    await prisma.invite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });

    const org = await prisma.organization.findUniqueOrThrow({
      where: { id: invite.orgId },
    });
    await sendWelcomeEmail(user.email, user.name, org.name).catch(() => {
      /* non-critical */
    });

    const accessToken = generateAccessToken(user.id, user.orgId, user.role);
    const refreshToken = await generateRefreshToken(user.id);

    reply.setCookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
    reply.code(201);

    return {
      accessToken,
      expiresIn: 900,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        orgId: user.orgId,
      },
    };
  });

  /* ── POST /auth/login ── */
  fastify.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });
    if (!user) {
      reply
        .code(401)
        .send({
          error: 'Unauthorized',
          message: 'Invalid email or password',
        });
      return;
    }

    const valid = await comparePassword(body.password, user.passwordHash);
    if (!valid) {
      reply
        .code(401)
        .send({
          error: 'Unauthorized',
          message: 'Invalid email or password',
        });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = generateAccessToken(user.id, user.orgId, user.role);
    const refreshToken = await generateRefreshToken(user.id);

    reply.setCookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());

    return {
      accessToken,
      expiresIn: 900,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        orgId: user.orgId,
      },
    };
  });

  /* ── POST /auth/refresh ── */
  fastify.post('/refresh', async (request, reply) => {
    const token = request.cookies[REFRESH_COOKIE];
    if (!token) {
      reply
        .code(401)
        .send({ error: 'Unauthorized', message: 'No refresh token' });
      return;
    }

    const existing = await prisma.refreshToken.findUnique({
      where: { token },
    });
    if (!existing || existing.expiresAt < new Date()) {
      reply
        .code(401)
        .send({
          error: 'Unauthorized',
          message: 'Invalid or expired refresh token',
        });
      return;
    }

    await prisma.refreshToken.delete({ where: { id: existing.id } });

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: existing.userId },
    });

    const newRefreshToken = await generateRefreshToken(user.id);
    const accessToken = generateAccessToken(user.id, user.orgId, user.role);

    reply.setCookie(REFRESH_COOKIE, newRefreshToken, refreshCookieOptions());

    return { accessToken, expiresIn: 900 };
  });

  /* ── POST /auth/logout ── */
  fastify.post('/logout', async (request, reply) => {
    const token = request.cookies[REFRESH_COOKIE];
    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token } });
    }

    reply.clearCookie(REFRESH_COOKIE, { path: COOKIE_PATH });
    reply.code(204);
    return;
  });

  /* ── GET /auth/reset-password/validate ── */
  fastify.get('/reset-password/validate', async (request, reply) => {
    const token = (request.query as { token?: string }).token;
    if (!token) {
      reply.code(400).send({ error: 'Missing token', valid: false });
      return;
    }
    const valid = await validateResetToken(token);
    if (!valid) {
      reply.code(400).send({ error: 'Invalid or expired token', valid: false });
      return;
    }
    return { valid: true };
  });

  /* ── POST /auth/forgot-password ── */
  fastify.post('/forgot-password', async (request) => {
    const body = forgotPasswordSchema.parse(request.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (user) {
      const token = await generateResetToken(user.id);
      const resetUrl = `${process.env.APP_URL ?? 'http://localhost:5173'}/reset-password?token=${token}`;
      await sendPasswordResetEmail(user.email, resetUrl).catch(() => {
        /* non-critical */
      });
    }

    return { message: 'If an account exists, a reset link has been sent.' };
  });

  /* ── POST /auth/reset-password ── */
  fastify.post('/reset-password', async (request, reply) => {
    const body = resetPasswordSchema.parse(request.body);

    const resetToken = await validateResetToken(body.token);
    if (!resetToken) {
      reply
        .code(400)
        .send({
          error: 'Invalid token',
          message: 'Reset token is invalid or expired',
        });
      return;
    }

    const passwordHash = await hashPassword(body.password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Password has been reset successfully.' };
  });

  /* ── GET /auth/me ── */
  fastify.get('/me', { preHandler: [requireAuth] }, async (request, reply) => {
    if (!request.user) {
      reply
        .code(401)
        .send({
          error: 'Unauthorized',
          message: 'Valid authentication required',
        });
      return;
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: request.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        orgId: true,
        createdAt: true,
        lastLoginAt: true,
        org: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
            isDemo: true,
            fakeCompanyName: true,
          },
        },
      },
    });

    return { user };
  });
}
