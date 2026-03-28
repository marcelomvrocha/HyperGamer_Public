import { EXERCISES } from './exercises';
import type { WorkoutSet, WorkoutLike } from './xp';

type Pattern = 'push' | 'pull' | 'hinge' | 'squat' | 'core';

interface WorkoutSetWithExercise extends WorkoutSet {
  exercise?: {
    name?: string;
    pattern?: string;
  } | null;
}

export interface WorkoutWithExercise extends WorkoutLike {
  sets?: WorkoutSetWithExercise[];
}

export interface WeeklyQuest {
  id: string;
  title: string;
  description: string;
  progress: number;
  goal: number;
  completed: boolean;
}

export interface BossBattle {
  id: string;
  pattern: Exclude<Pattern, 'core'>;
  title: string;
  description: string;
  currentBest: number;
  targetReps: number;
  progress: number;
  goal: number;
  completed: boolean;
}

const PATTERNS: Array<Exclude<Pattern, 'core'>> = ['pull', 'push', 'hinge', 'squat'];

function getWeekStart(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function normalizePattern(pattern?: string | null): Pattern | null {
  if (!pattern) return null;
  const lower = pattern.toLowerCase();
  if (lower === 'push' || lower === 'pull' || lower === 'hinge' || lower === 'squat' || lower === 'core') {
    return lower as Pattern;
  }
  return null;
}

function matchExercisePattern(name?: string | null): Pattern | null {
  if (!name) return null;
  const match = EXERCISES.find(ex => ex.name.toLowerCase() === name.toLowerCase());
  if (match) return match.pattern;
  const lower = name.toLowerCase();
  if (lower.includes('pull') && !lower.includes('push')) return 'pull';
  if (lower.includes('row')) return 'pull';
  if (lower.includes('press') || lower.includes('push')) return 'push';
  if (lower.includes('rdl') || lower.includes('deadlift') || lower.includes('hinge')) return 'hinge';
  if (lower.includes('squat') || lower.includes('split')) return 'squat';
  if (lower.includes('leg raise') || lower.includes('side bend') || lower.includes('core')) return 'core';
  return null;
}

function getPatternForSet(set: WorkoutSetWithExercise): Pattern | null {
  return (
    normalizePattern(set.exercise?.pattern) ||
    matchExercisePattern(set.exercise?.name)
  );
}

function countUniqueDays(workouts: WorkoutWithExercise[]) {
  const map = new Map<string, true>();
  workouts.forEach(workout => {
    const date = new Date(workout.date);
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    map.set(key, true);
  });
  return map.size;
}

function buildPatternBestMap(workouts: WorkoutWithExercise[]) {
  const map: Record<string, number> = {};
  PATTERNS.forEach(pattern => {
    map[pattern] = 0;
  });
  workouts.forEach(workout => {
    workout.sets?.forEach(set => {
      const pattern = getPatternForSet(set);
      if (!pattern || pattern === 'core') return;
      const reps = Number.isFinite(set.reps) ? set.reps : 0;
      if (reps > map[pattern]) {
        map[pattern] = reps;
      }
    });
  });
  return map;
}

export function getWeeklyQuestSummary(workouts: WorkoutWithExercise[]) {
  const now = new Date();
  const weekStart = getWeekStart(now);
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(weekStart.getDate() - 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const thisWeek = workouts.filter(workout => {
    const date = new Date(workout.date);
    return date >= weekStart && date < weekEnd;
  });
  const lastWeek = workouts.filter(workout => {
    const date = new Date(workout.date);
    return date >= lastWeekStart && date < weekStart;
  });

  const sessionsThisWeek = countUniqueDays(thisWeek);
  const setsThisWeek = thisWeek.reduce((sum, workout) => sum + (workout.sets?.length || 0), 0);
  const qualitySets = thisWeek.reduce(
    (sum, workout) =>
      sum + (workout.sets?.filter(set => typeof set.rir === 'number' && set.rir <= 2).length || 0),
    0
  );
  const tempoSets = thisWeek.reduce(
    (sum, workout) =>
      sum + (workout.sets?.filter(set => (set.tempoEccSec || 0) >= 3).length || 0),
    0
  );

  const quests: WeeklyQuest[] = [
    {
      id: 'weekly-consistency',
      title: 'Consistency Quest',
      description: 'Train on 3 separate days this week.',
      progress: Math.min(sessionsThisWeek, 3),
      goal: 3,
      completed: sessionsThisWeek >= 3,
    },
    {
      id: 'weekly-volume',
      title: 'Volume Quest',
      description: 'Accumulate 30 working sets this week.',
      progress: Math.min(setsThisWeek, 30),
      goal: 30,
      completed: setsThisWeek >= 30,
    },
    {
      id: 'weekly-quality',
      title: 'Quality Quest',
      description: 'Log 10 sets at RIR 2 or lower.',
      progress: Math.min(qualitySets, 10),
      goal: 10,
      completed: qualitySets >= 10,
    },
    {
      id: 'weekly-tempo',
      title: 'Tempo Quest',
      description: 'Complete 6 sets with 3s+ eccentrics.',
      progress: Math.min(tempoSets, 6),
      goal: 6,
      completed: tempoSets >= 6,
    },
  ];

  const thisWeekBest = buildPatternBestMap(thisWeek);
  const lastWeekBest = buildPatternBestMap(lastWeek);

  const bosses: BossBattle[] = PATTERNS.map(pattern => {
    const lastBest = lastWeekBest[pattern] || 0;
    const currentBest = thisWeekBest[pattern] || 0;

    if (lastBest > 0) {
      const target = lastBest + 1;
      return {
        id: `boss-${pattern}`,
        pattern,
        title: `${pattern.toUpperCase()} Boss`,
        description: `Beat last week's best of ${lastBest} reps.`,
        currentBest,
        targetReps: target,
        progress: Math.min(currentBest, target),
        goal: target,
        completed: currentBest >= target,
      };
    }

    return {
      id: `boss-${pattern}`,
      pattern,
      title: `${pattern.toUpperCase()} Boss`,
      description: 'Set a baseline this week (log any working set).',
      currentBest,
      targetReps: 1,
      progress: currentBest > 0 ? 1 : 0,
      goal: 1,
      completed: currentBest > 0,
    };
  });

  return {
    quests,
    bosses,
    weekStart,
    weekEnd,
  };
}
