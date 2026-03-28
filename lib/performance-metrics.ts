import {
  EXERCISES,
  findExerciseByName,
  getPerformanceLabel,
  getPrimarySequenceForExercise,
  inferWorkoutSequenceFromWorkout,
  type ExerciseDefinition,
  type ExercisePattern,
  type WorkoutSequenceId,
} from './exercises';

export type PerformanceGroup = WorkoutSequenceId | 'core';
export type PerformanceTrend = 'up' | 'down' | 'stable';

export interface WorkoutSetWithExerciseRef {
  reps: number;
  exercise?: {
    name?: string | null;
    pattern?: string | null;
  } | null;
}

export interface WorkoutWithExerciseRefs {
  date: string | Date;
  createdAt?: string | Date;
  sets?: WorkoutSetWithExerciseRef[] | null;
}

export interface PerformanceTimelinePoint {
  date: string;
  [exerciseId: string]: string | number;
}

export interface ExerciseWeekComparison {
  exerciseId: string;
  label: string;
  group: PerformanceGroup;
  pattern: ExercisePattern;
  thisWeek: number;
  lastWeek: number;
  change: number;
  changePercent: number;
  trend: PerformanceTrend;
}

export function extractDateKey(dateInput: Date | string): string {
  if (typeof dateInput === 'string') {
    const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
  }

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function getWeekStartKey(dateKey: string): string {
  const date = parseDateKey(dateKey);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.getFullYear(), date.getMonth(), diff);
  monday.setHours(0, 0, 0, 0);
  return extractDateKey(monday);
}

function getPerformanceGroup(exercise: ExerciseDefinition): PerformanceGroup {
  if (exercise.pattern === 'core') return 'core';
  return getPrimarySequenceForExercise(exercise) ?? 'core';
}

export function buildDailyPerformanceTimeline(
  workouts: WorkoutWithExerciseRefs[],
  exercises: ExerciseDefinition[] = EXERCISES,
  options?: { carryForwardMissingValues?: boolean }
): PerformanceTimelinePoint[] {
  const carryForwardMissingValues = options?.carryForwardMissingValues ?? false;
  const enabledExerciseIds = new Set(exercises.map(exercise => exercise.id));
  const dailyMap = new Map<string, Record<string, number>>();

  workouts.forEach(workout => {
    const dateKey = extractDateKey(workout.date);
    const current = dailyMap.get(dateKey) ?? {};

    workout.sets?.forEach(set => {
      const exercise = findExerciseByName(set.exercise?.name);
      if (!exercise || !enabledExerciseIds.has(exercise.id)) return;

      const reps = Number.isFinite(set.reps) ? set.reps : 0;
      if (exercise.performanceMetric === 'totalReps') {
        current[exercise.id] = (current[exercise.id] ?? 0) + reps;
      } else {
        current[exercise.id] = Math.max(current[exercise.id] ?? 0, reps);
      }
    });

    dailyMap.set(dateKey, current);
  });

  const sortedEntries = Array.from(dailyMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const lastKnownByExercise: Record<string, number | undefined> = {};

  return sortedEntries
    .map(([date, values]) => {
      const point: PerformanceTimelinePoint = { date };

      exercises.forEach(exercise => {
        const currentValue = values[exercise.id];
        if (currentValue !== undefined) {
          point[exercise.id] = currentValue;
          lastKnownByExercise[exercise.id] = currentValue;
          return;
        }

        if (carryForwardMissingValues && lastKnownByExercise[exercise.id] !== undefined) {
          point[exercise.id] = lastKnownByExercise[exercise.id] as number;
          return;
        }

        point[exercise.id] = 0;
      });

      return point;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function buildWeeklyExerciseComparisons(
  workouts: WorkoutWithExerciseRefs[],
  exercises: ExerciseDefinition[] = EXERCISES,
  options?: { carryForwardMissingValues?: boolean }
): ExerciseWeekComparison[] {
  const carryForwardMissingValues = options?.carryForwardMissingValues ?? true;
  const timeline = buildDailyPerformanceTimeline(workouts, exercises, {
    carryForwardMissingValues,
  });
  const weeklyMap = new Map<string, Record<string, number>>();

  timeline.forEach(point => {
    const weekKey = getWeekStartKey(point.date);
    const current = weeklyMap.get(weekKey) ?? {};

    exercises.forEach(exercise => {
      const value = Number(point[exercise.id] ?? 0);
      current[exercise.id] = Math.max(current[exercise.id] ?? 0, value);
    });

    weeklyMap.set(weekKey, current);
  });

  const weeklyData = Array.from(weeklyMap.entries())
    .map(([weekStart, values]) => ({ weekStart, values }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));

  if (weeklyData.length < 2) {
    return [];
  }

  const thisWeek = weeklyData[weeklyData.length - 1].values;
  const lastWeek = weeklyData[weeklyData.length - 2].values;

  return exercises.map(exercise => {
    const thisWeekValue = thisWeek[exercise.id] ?? 0;
    const lastWeekValue = lastWeek[exercise.id] ?? 0;
    const change = thisWeekValue - lastWeekValue;
    const changePercent =
      lastWeekValue > 0 ? (change / lastWeekValue) * 100 : 0;

    return {
      exerciseId: exercise.id,
      label: getPerformanceLabel(exercise),
      group: getPerformanceGroup(exercise),
      pattern: exercise.pattern,
      thisWeek: thisWeekValue,
      lastWeek: lastWeekValue,
      change,
      changePercent,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
    };
  });
}

export function getLatestLoggedSequence(
  workouts: WorkoutWithExerciseRefs[]
): WorkoutSequenceId | null {
  const sorted = [...workouts].sort(
    (a, b) =>
      new Date(b.createdAt ?? b.date).getTime() - new Date(a.createdAt ?? a.date).getTime()
  );

  for (const workout of sorted) {
    const sequence = inferWorkoutSequenceFromWorkout(workout);
    if (sequence) {
      return sequence;
    }
  }

  return null;
}
