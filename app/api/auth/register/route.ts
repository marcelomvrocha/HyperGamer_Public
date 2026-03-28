import { NextResponse } from 'next/server';
import { createSession, hashPassword, normalizeEmail, setSessionCookie, toPublicUser } from '@/lib/auth';
import { normalizeAvatarId } from '@/lib/avatars';
import { prisma } from '@/lib/prisma';

const MIN_PASSWORD_LENGTH = 8;

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const payload = body as {
      email?: string;
      password?: string;
      displayName?: string;
      avatar?: string;
    };

    const email = typeof payload.email === 'string' ? normalizeEmail(payload.email) : '';
    const password = typeof payload.password === 'string' ? payload.password : '';
    const displayName = typeof payload.displayName === 'string' ? payload.displayName.trim() : '';
    const avatar = normalizeAvatarId(typeof payload.avatar === 'string' ? payload.avatar : undefined);

    if (!email || !password || !displayName) {
      return NextResponse.json({ error: 'Email, password, and display name are required.' }, { status: 400 });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
    }

    const userCount = await prisma.user.count();

    const user = await prisma.user.create({
      data: {
        email,
        displayName,
        avatar,
        passwordHash: hashPassword(password),
      },
    });

    // Migrate any legacy rows (before multi-user) to the very first created account.
    if (userCount === 0) {
      await prisma.workout.updateMany({ where: { userId: null }, data: { userId: user.id } });
      await prisma.biometricsWeekly.updateMany({ where: { userId: null }, data: { userId: user.id } });
      await prisma.nutritionDaily.updateMany({ where: { userId: null }, data: { userId: user.id } });
      await prisma.target.updateMany({ where: { userId: null }, data: { userId: user.id } });
    }

    const { token, expiresAt } = await createSession(user.id);

    const response = NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
    setSessionCookie(response, token, expiresAt, request);
    return response;
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json({ error: 'Failed to register account.' }, { status: 500 });
  }
}
