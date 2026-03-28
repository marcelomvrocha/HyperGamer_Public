import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import basePathHelpers from '@/lib/base-path';

export const SESSION_COOKIE_NAME = 'hypergamer_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const { getConfiguredBasePath } = basePathHelpers;

function getSessionCookiePath(): string {
  const basePath = getConfiguredBasePath();
  return basePath || '/';
}

const SESSION_COOKIE_PATH = getSessionCookiePath();

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function shouldUseSecureCookie(request?: Request): boolean {
  if (process.env.NODE_ENV !== 'production') {
    return false;
  }

  if (!request) {
    return true;
  }

  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase();
  if (forwardedProto) {
    return forwardedProto === 'https';
  }

  try {
    return new URL(request.url).protocol === 'https:';
  } catch {
    return true;
  }
}

function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, passwordHash: string): boolean {
  const [salt, storedHex] = passwordHash.split(':');
  if (!salt || !storedHex) {
    return false;
  }

  const derived = scryptSync(password, salt, 64).toString('hex');

  try {
    const storedBuffer = Buffer.from(storedHex, 'hex');
    const derivedBuffer = Buffer.from(derived, 'hex');
    if (storedBuffer.length !== derivedBuffer.length) {
      return false;
    }
    return timingSafeEqual(storedBuffer, derivedBuffer);
  } catch {
    return false;
  }
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export function setSessionCookie(response: NextResponse, token: string, expiresAt: Date, request?: Request): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: shouldUseSecureCookie(request),
    path: SESSION_COOKIE_PATH,
    expires: expiresAt,
  });
}

export function clearSessionCookie(response: NextResponse, request?: Request): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: shouldUseSecureCookie(request),
    path: SESSION_COOKIE_PATH,
    expires: new Date(0),
  });
}

function getSessionTokenFromRequest(request?: Request): string | null {
  if (!request) {
    return null;
  }

  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) {
    return null;
  }

  for (const item of cookieHeader.split(';')) {
    const trimmed = item.trim();
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const name = trimmed.slice(0, separatorIndex);
    if (name !== SESSION_COOKIE_NAME) {
      continue;
    }

    const value = trimmed.slice(separatorIndex + 1);
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  return null;
}

export async function deleteSessionForToken(token: string): Promise<void> {
  await prisma.session.deleteMany({
    where: {
      tokenHash: hashSessionToken(token),
    },
  });
}

export async function getCurrentUser(request?: Request) {
  const token = getSessionTokenFromRequest(request);
  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: true },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return session.user;
}

export async function getCurrentUserId(request?: Request): Promise<string | null> {
  const user = await getCurrentUser(request);
  return user?.id ?? null;
}

export async function getCurrentSessionToken(request?: Request): Promise<string | null> {
  return getSessionTokenFromRequest(request);
}

export type PublicUser = {
  id: string;
  email: string;
  displayName: string;
  avatar: string;
  createdAt: Date;
  updatedAt: Date;
};

export function toPublicUser(user: {
  id: string;
  email: string;
  displayName: string;
  avatar: string;
  createdAt: Date;
  updatedAt: Date;
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatar: user.avatar,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
