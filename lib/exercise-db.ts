import { EXERCISES, findExerciseByName, normalizeExerciseName } from '@/lib/exercises';
import { EXERCISE_DEMOS } from '@/lib/exercise-demos';
import { prisma } from '@/lib/prisma';

type ExerciseRecordInput = {
  name: string;
  pattern: string;
  equipment: string;
  defaultRepRangeMin: number;
  defaultRepRangeMax: number;
  videoUrl?: string;
  imageUrl?: string;
  instructions?: string;
  targetMuscles?: string;
};

function buildExerciseRecordInput(name: string): ExerciseRecordInput {
  const trimmedName = name.trim();
  const knownExercise = findExerciseByName(trimmedName);
  const resolvedName = knownExercise?.name ?? trimmedName;
  const demo = EXERCISE_DEMOS[resolvedName];
  const targetMuscles = demo?.targetMuscles?.length ? demo.targetMuscles.join(', ') : undefined;

  return {
    name: resolvedName,
    pattern: knownExercise?.pattern ?? 'custom',
    equipment: knownExercise?.equipment ?? 'Imported',
    defaultRepRangeMin: knownExercise?.defaultRepRangeMin ?? 8,
    defaultRepRangeMax: knownExercise?.defaultRepRangeMax ?? 12,
    videoUrl: demo?.videoUrl,
    imageUrl: demo?.imageUrl,
    instructions: demo?.instructions,
    targetMuscles,
  };
}

export async function syncBuiltInExercises(): Promise<void> {
  for (const exercise of EXERCISES) {
    const data = buildExerciseRecordInput(exercise.name);
    await prisma.exercise.upsert({
      where: { name: data.name },
      update: {
        pattern: data.pattern,
        equipment: data.equipment,
        defaultRepRangeMin: data.defaultRepRangeMin,
        defaultRepRangeMax: data.defaultRepRangeMax,
        videoUrl: data.videoUrl,
        imageUrl: data.imageUrl,
        instructions: data.instructions,
        targetMuscles: data.targetMuscles,
      },
      create: data,
    });
  }
}

export async function ensureExerciseRecords(names: string[]): Promise<Map<string, string>> {
  await syncBuiltInExercises();

  const desiredNames = Array.from(
    new Set(
      names
        .map(name => buildExerciseRecordInput(name).name)
        .filter(Boolean)
    )
  );

  if (desiredNames.length > 0) {
    const existing = await prisma.exercise.findMany({
      where: {
        name: {
          in: desiredNames,
        },
      },
      select: {
        name: true,
      },
    });

    const existingNames = new Set(existing.map(exercise => normalizeExerciseName(exercise.name)));

    for (const name of desiredNames) {
      const key = normalizeExerciseName(name);
      if (existingNames.has(key)) {
        continue;
      }

      await prisma.exercise.create({
        data: buildExerciseRecordInput(name),
      });
      existingNames.add(key);
    }
  }

  const exercises = await prisma.exercise.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  return new Map(exercises.map(exercise => [normalizeExerciseName(exercise.name), exercise.id]));
}
