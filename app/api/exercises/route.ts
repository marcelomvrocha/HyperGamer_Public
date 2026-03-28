import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { syncBuiltInExercises } from '@/lib/exercise-db';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await syncBuiltInExercises();

    const exercises = await prisma.exercise.findMany();
    return NextResponse.json(exercises);
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return NextResponse.json({ error: 'Failed to fetch exercises' }, { status: 500 });
  }
}
