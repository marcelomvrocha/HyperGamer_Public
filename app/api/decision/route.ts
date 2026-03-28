import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { generateDecision } from '@/lib/decision-engine';

export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decision = await generateDecision(userId);
    return NextResponse.json(decision);
  } catch (error) {
    console.error('Error generating decision:', error);
    return NextResponse.json({ error: 'Failed to generate decision' }, { status: 500 });
  }
}
