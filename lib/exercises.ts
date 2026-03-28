// Exercise library with progression rules and sequence metadata
export type WorkoutSequenceId = 'upper' | 'lower';
export type ExercisePattern = 'push' | 'pull' | 'hinge' | 'squat' | 'core';
export type ProgressionPolicy = 'reps' | 'tempo' | 'technique' | 'sets';
export type PerformanceMetric = 'bestSet' | 'totalReps';

export interface WorkoutSequenceDefinition {
  id: WorkoutSequenceId;
  label: string;
  shortLabel: string;
  description: string;
}

export interface ExerciseDefinition {
  id: string;
  name: string;
  pattern: ExercisePattern;
  equipment: string;
  defaultRepRangeMin: number;
  defaultRepRangeMax: number;
  sequences: WorkoutSequenceId[];
  progressionPolicy: ProgressionPolicy;
  performanceMetric: PerformanceMetric;
  chartColor: string;
}

export const WORKOUT_SEQUENCES: WorkoutSequenceDefinition[] = [
  {
    id: 'upper',
    label: 'Upper Body',
    shortLabel: 'Upper',
    description: 'Push and pull work plus shared abs.',
  },
  {
    id: 'lower',
    label: 'Lower Body',
    shortLabel: 'Lower',
    description: 'Leg and posterior-chain work plus shared abs.',
  },
];

export const EXERCISES: ExerciseDefinition[] = [
  // Upper body sequence
  {
    id: 'pull-ups',
    name: 'Pull-ups',
    pattern: 'pull',
    equipment: 'Bar',
    defaultRepRangeMin: 8,
    defaultRepRangeMax: 12,
    sequences: ['upper'],
    progressionPolicy: 'reps',
    performanceMetric: 'totalReps',
    chartColor: '#ef4444',
  },
  {
    id: 'floor-press',
    name: 'Floor Press',
    pattern: 'push',
    equipment: 'Dumbbells',
    defaultRepRangeMin: 8,
    defaultRepRangeMax: 12,
    sequences: ['upper'],
    progressionPolicy: 'tempo',
    performanceMetric: 'bestSet',
    chartColor: '#3b82f6',
  },
  {
    id: 'rows',
    name: 'Rows',
    pattern: 'pull',
    equipment: 'Dumbbells',
    defaultRepRangeMin: 8,
    defaultRepRangeMax: 12,
    sequences: ['upper'],
    progressionPolicy: 'reps',
    performanceMetric: 'bestSet',
    chartColor: '#f59e0b',
  },
  {
    id: 'pike-pushups',
    name: 'Pike Push-ups',
    pattern: 'push',
    equipment: 'Bodyweight',
    defaultRepRangeMin: 8,
    defaultRepRangeMax: 15,
    sequences: ['upper'],
    progressionPolicy: 'reps',
    performanceMetric: 'bestSet',
    chartColor: '#ec4899',
  },
  {
    id: 'lateral-raise',
    name: 'Lateral Raise',
    pattern: 'push',
    equipment: 'Dumbbells',
    defaultRepRangeMin: 12,
    defaultRepRangeMax: 20,
    sequences: ['upper'],
    progressionPolicy: 'reps',
    performanceMetric: 'bestSet',
    chartColor: '#14b8a6',
  },
  {
    id: 'hammer-curl',
    name: 'Hammer Curl',
    pattern: 'pull',
    equipment: 'Dumbbells',
    defaultRepRangeMin: 10,
    defaultRepRangeMax: 15,
    sequences: ['upper'],
    progressionPolicy: 'reps',
    performanceMetric: 'bestSet',
    chartColor: '#fb7185',
  },

  // Lower body sequence
  {
    id: 'goblet-squat',
    name: 'Goblet Squat',
    pattern: 'squat',
    equipment: 'Dumbbell',
    defaultRepRangeMin: 8,
    defaultRepRangeMax: 12,
    sequences: ['lower'],
    progressionPolicy: 'tempo',
    performanceMetric: 'bestSet',
    chartColor: '#22c55e',
  },
  {
    id: 'split-squat',
    name: 'Split Squat',
    pattern: 'squat',
    equipment: 'Dumbbells',
    defaultRepRangeMin: 8,
    defaultRepRangeMax: 12,
    sequences: ['lower'],
    progressionPolicy: 'tempo',
    performanceMetric: 'bestSet',
    chartColor: '#10b981',
  },
  {
    id: 'rdl',
    name: 'RDL',
    pattern: 'hinge',
    equipment: 'Dumbbells',
    defaultRepRangeMin: 8,
    defaultRepRangeMax: 12,
    sequences: ['lower'],
    progressionPolicy: 'tempo',
    performanceMetric: 'bestSet',
    chartColor: '#8b5cf6',
  },
  {
    id: 'glute-bridge',
    name: 'Glute Bridge',
    pattern: 'hinge',
    equipment: 'Bodyweight/Dumbbell',
    defaultRepRangeMin: 10,
    defaultRepRangeMax: 20,
    sequences: ['lower'],
    progressionPolicy: 'reps',
    performanceMetric: 'bestSet',
    chartColor: '#a855f7',
  },
  {
    id: 'hamstring-curl-yoga-ball',
    name: 'Hamstring Curl (Yoga Ball)',
    pattern: 'hinge',
    equipment: 'Yoga Ball',
    defaultRepRangeMin: 8,
    defaultRepRangeMax: 15,
    sequences: ['lower'],
    progressionPolicy: 'reps',
    performanceMetric: 'bestSet',
    chartColor: '#6366f1',
  },
  {
    id: 'standing-calf-raise',
    name: 'Standing Calf Raise',
    pattern: 'squat',
    equipment: 'Bodyweight/Dumbbell',
    defaultRepRangeMin: 12,
    defaultRepRangeMax: 20,
    sequences: ['lower'],
    progressionPolicy: 'reps',
    performanceMetric: 'bestSet',
    chartColor: '#84cc16',
  },

  // Shared abs for both sequences
  {
    id: 'ab-crunch-yoga-ball',
    name: 'Ab Crunch (Yoga Ball)',
    pattern: 'core',
    equipment: 'Yoga Ball',
    defaultRepRangeMin: 10,
    defaultRepRangeMax: 20,
    sequences: ['upper', 'lower'],
    progressionPolicy: 'reps',
    performanceMetric: 'bestSet',
    chartColor: '#06b6d4',
  },
  {
    id: 'leg-raises-yoga-ball',
    name: 'Leg Raises (Yoga Ball)',
    pattern: 'core',
    equipment: 'Yoga Ball',
    defaultRepRangeMin: 10,
    defaultRepRangeMax: 20,
    sequences: ['upper', 'lower'],
    progressionPolicy: 'reps',
    performanceMetric: 'bestSet',
    chartColor: '#facc15',
  },
];

export function normalizeExerciseName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');
}

export function findExerciseById(exerciseId: string): ExerciseDefinition | undefined {
  return EXERCISES.find(exercise => exercise.id === exerciseId);
}

export function findExerciseByName(name?: string | null): ExerciseDefinition | undefined {
  if (!name) return undefined;
  const normalizedTarget = normalizeExerciseName(name);
  return EXERCISES.find(exercise => normalizeExerciseName(exercise.name) === normalizedTarget);
}

export function getSequenceDefinition(sequence: WorkoutSequenceId): WorkoutSequenceDefinition {
  return WORKOUT_SEQUENCES.find(item => item.id === sequence) ?? WORKOUT_SEQUENCES[0];
}

export function getSequenceExercises(
  sequence: WorkoutSequenceId,
  options?: { includeCore?: boolean }
): ExerciseDefinition[] {
  const includeCore = options?.includeCore ?? true;
  return EXERCISES.filter(exercise => {
    if (!exercise.sequences.includes(sequence)) {
      return false;
    }
    if (!includeCore && exercise.pattern === 'core') {
      return false;
    }
    return true;
  });
}

export function getSequenceExerciseIds(
  sequence: WorkoutSequenceId,
  options?: { includeCore?: boolean }
): string[] {
  return getSequenceExercises(sequence, options).map(exercise => exercise.id);
}

export function getCoreExercises(): ExerciseDefinition[] {
  return EXERCISES.filter(exercise => exercise.pattern === 'core');
}

export function getPrimarySequenceForExercise(exercise: ExerciseDefinition): WorkoutSequenceId | null {
  if (exercise.pattern === 'core') return null;
  return exercise.sequences[0] ?? null;
}

export function inferWorkoutSequenceFromExerciseName(name?: string | null): WorkoutSequenceId | null {
  const exercise = findExerciseByName(name);
  return exercise ? getPrimarySequenceForExercise(exercise) : null;
}

export function inferWorkoutSequenceFromWorkout(
  workout?: {
    sets?: Array<{
      exercise?: {
        name?: string | null;
      } | null;
    }> | null;
  } | null
): WorkoutSequenceId | null {
  if (!workout?.sets?.length) return null;

  const counts: Record<WorkoutSequenceId, number> = {
    upper: 0,
    lower: 0,
  };

  workout.sets.forEach(set => {
    const sequence = inferWorkoutSequenceFromExerciseName(set.exercise?.name);
    if (sequence) {
      counts[sequence] += 1;
    }
  });

  if (counts.upper === counts.lower) return null;
  return counts.upper > counts.lower ? 'upper' : 'lower';
}

export function isBodyweightExercise(exercise: ExerciseDefinition | string): boolean {
  const definition = typeof exercise === 'string' ? findExerciseById(exercise) : exercise;
  if (!definition) return false;
  return (
    definition.equipment === 'Bar' ||
    definition.equipment === 'Bodyweight' ||
    definition.equipment === 'Yoga Ball'
  );
}

export function isPerHandExercise(exerciseId: string): boolean {
  return exerciseId === 'split-squat' || exerciseId === 'rdl' || exerciseId === 'standing-calf-raise';
}

export function getPerformanceLabel(exercise: ExerciseDefinition): string {
  return exercise.performanceMetric === 'totalReps' ? `${exercise.name} Total` : exercise.name;
}
