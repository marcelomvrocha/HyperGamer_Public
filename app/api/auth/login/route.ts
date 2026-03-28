import { NextResponse } from 'next/server';
import { createSession, normalizeEmail, setSessionCookie, toPublicUser, verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const payload = body as {
      email?: string;
      password?: string;
    };

    const email = typeof payload.email === 'string' ? normalizeEmail(payload.email) : '';
    const password = typeof payload.password === 'string' ? payload.password : '';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const { token, expiresAt } = await createSession(user.id);
    const response = NextResponse.json({ user: toPublicUser(user) });
    setSessionCookie(response, token, expiresAt, request);
    return response;
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json({ error: 'Failed to log in.' }, { status: 500 });
  }
}
