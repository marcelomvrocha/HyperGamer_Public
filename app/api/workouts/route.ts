import type { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { normalizeTechnique, type WorkoutSetInput } from '@/lib/workout-types';

interface WorkoutPostBody {
  date?: string;
  template?: string;
  sequence?: string;
  duration?: number;
  notes?: string;
  sets?: WorkoutSetInput[];
}

interface ValidatedWorkoutSetInput extends WorkoutSetInput {
  exerciseId: string;
  reps: number;
}

export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';
    const parsedLimit = parseInt(searchParams.get('limit') || '10', 10);
    const take = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;
    const template = searchParams.get('sequence') || searchParams.get('template');
    const view = searchParams.get('view');
    const useCompactView = view === 'compact';

    const workouts = await prisma.workout.findMany({
      where: {
        userId,
        ...(template ? { template } : {}),
      },
      ...(all ? {} : { take }),
      orderBy: { date: 'desc' },
      include: useCompactView
        ? {
            sets: {
              select: {
                setIndex: true,
                reps: true,
                loadLbs: true,
                rir: true,
                tempoEccSec: true,
                tempoPauseSec: true,
                tempoConcSec: true,
                technique: true,
                notes: true,
                exercise: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          }
        : {
            sets: {
              include: {
                exercise: true,
              },
            },
          },
    });

    return NextResponse.json(workouts);
  } catch (error) {
    console.error('Error fetching workouts:', error);
    return NextResponse.json({ error: 'Failed to fetch workouts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as WorkoutPostBody;
    const { date, template: rawTemplate, sequence, duration, notes, sets } = body;
    const template = sequence || rawTemplate;

    // Validate required fields
    if (!template) {
      return NextResponse.json({ error: 'Workout sequence is required' }, { status: 400 });
    }
    if (!sets || !Array.isArray(sets) || sets.length === 0) {
      return NextResponse.json({ error: 'At least one set is required' }, { status: 400 });
    }

    // Create workout - normalize date to start of day to avoid timezone issues
    let workoutDate: Date;
    if (date) {
      // If date is provided as string (YYYY-MM-DD), parse it directly
      if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [year, month, day] = date.split('-').map(Number);
        workoutDate = new Date(year, month - 1, day); // month is 0-indexed
      } else {
        workoutDate = new Date(date);
      }
    } else {
      workoutDate = new Date();
    }
    workoutDate.setHours(0, 0, 0, 0); // Set to start of day
    
    console.log(`Creating workout for date: ${workoutDate.toISOString()}, template: ${template}, sets: ${sets.length}`);
    
    // Validate all sets have exerciseId and reps
    for (const set of sets) {
      if (!set.exerciseId) {
        console.error('Set missing exerciseId:', set);
        return NextResponse.json({ error: 'All sets must have an exerciseId' }, { status: 400 });
      }
      if (!set.reps || set.reps <= 0) {
        console.error('Set missing valid reps:', set);
        return NextResponse.json({ error: 'All sets must have valid reps > 0' }, { status: 400 });
      }
    }
    
    const validatedSets: ValidatedWorkoutSetInput[] = sets.map(set => ({
      ...set,
      exerciseId: set.exerciseId as string,
      reps: set.reps as number,
    }));

    const setCreates: Prisma.SetUncheckedCreateWithoutWorkoutInput[] = validatedSets.map((set, index) => ({
      exerciseId: set.exerciseId,
      setIndex: index,
      reps: set.reps,
      loadLbs: typeof set.loadLbs === 'number' ? set.loadLbs : null,
      rir: typeof set.rir === 'number' ? set.rir : null,
      tempoEccSec: typeof set.tempoEccSec === 'number' ? set.tempoEccSec : null,
      tempoPauseSec: typeof set.tempoPauseSec === 'number' ? set.tempoPauseSec : null,
      tempoConcSec: typeof set.tempoConcSec === 'number' ? set.tempoConcSec : null,
      technique: normalizeTechnique(set.technique) ?? 'none',
      notes: typeof set.notes === 'string' ? set.notes : null,
    }));

    const workout = await prisma.workout.create({
      data: {
        userId,
        date: workoutDate,
        template,
        duration,
        notes,
        sets: {
          create: setCreates,
        },
      },
      include: {
        sets: {
          include: {
            exercise: true,
          },
        },
      },
    });

    console.log(`Successfully created workout ${workout.id} with ${workout.sets.length} sets`);
    return NextResponse.json(workout);
  } catch (error: unknown) {
    console.error('Error creating workout:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Failed to create workout', 
      details: errorMessage 
    }, { status: 500 });
  }
}
