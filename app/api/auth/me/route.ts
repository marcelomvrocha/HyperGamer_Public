import { NextResponse } from 'next/server';
import {
  getCurrentUser,
  getCurrentUserId,
  hashPassword,
  toPublicUser,
  verifyPassword,
} from '@/lib/auth';
import { normalizeAvatarId } from '@/lib/avatars';
import { prisma } from '@/lib/prisma';

const MIN_PASSWORD_LENGTH = 8;

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error('Error loading current user:', error);
    return NextResponse.json({ error: 'Failed to load user.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getCurrentUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: unknown = await request.json();
    const payload = body as {
      displayName?: string;
      avatar?: string;
      currentPassword?: string;
      newPassword?: string;
    };

    const displayName = typeof payload.displayName === 'string' ? payload.displayName.trim() : undefined;
    const avatar = typeof payload.avatar === 'string' ? normalizeAvatarId(payload.avatar) : undefined;
    const currentPassword = typeof payload.currentPassword === 'string' ? payload.currentPassword : undefined;
    const newPassword = typeof payload.newPassword === 'string' ? payload.newPassword : undefined;

    if (!displayName && avatar === undefined && !newPassword) {
      return NextResponse.json({ error: 'No profile changes provided.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const updateData: { displayName?: string; avatar?: string; passwordHash?: string } = {};

    if (displayName !== undefined) {
      if (displayName.length < 2) {
        return NextResponse.json({ error: 'Display name must be at least 2 characters.' }, { status: 400 });
      }
      updateData.displayName = displayName;
    }

    if (avatar !== undefined) {
      updateData.avatar = avatar;
    }

    if (newPassword !== undefined) {
      if (!currentPassword || !verifyPassword(currentPassword, user.passwordHash)) {
        return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
      }
      if (newPassword.length < MIN_PASSWORD_LENGTH) {
        return NextResponse.json(
          { error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
          { status: 400 }
        );
      }
      updateData.passwordHash = hashPassword(newPassword);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({ user: toPublicUser(updatedUser) });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
  }
}
