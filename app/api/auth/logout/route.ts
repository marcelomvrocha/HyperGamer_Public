import { NextResponse } from 'next/server';
import { clearSessionCookie, deleteSessionForToken, getCurrentSessionToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const token = await getCurrentSessionToken(request);
    if (token) {
      await deleteSessionForToken(token);
    }

    const response = NextResponse.json({ success: true });
    clearSessionCookie(response, request);
    return response;
  } catch (error) {
    console.error('Error logging out:', error);
    return NextResponse.json({ error: 'Failed to log out.' }, { status: 500 });
  }
}
