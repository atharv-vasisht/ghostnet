import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';

// Ensure DATABASE_URL and other env vars are loaded both in dev (tsx)
// and in production containers. In dev, cwd is apps/api, so go up two
// levels to the repo root where .env lives.
loadEnv({ path: resolve(process.cwd(), '../../.env') });

export const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10);

export interface TokenPayload {
  userId: string;
  orgId: string;
  role: Role;
}

export function generateAccessToken(userId: string, orgId: string, role: Role): string {
  return jwt.sign({ userId, orgId, role }, JWT_SECRET, { expiresIn: '15m' });
}

export async function generateRefreshToken(userId: string): Promise<string> {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: { token, userId, expiresAt },
  });

  return token;
}

export function verifyAccessToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (typeof decoded === 'string') {
    throw new Error('Invalid token format');
  }
  return { userId: decoded.userId, orgId: decoded.orgId, role: decoded.role } as TokenPayload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function generateResetToken(userId: string): Promise<string> {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { token, userId, expiresAt },
  });

  return token;
}

export async function validateResetToken(token: string) {
  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return null;
  }

  return record;
}
