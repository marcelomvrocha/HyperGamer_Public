export interface WorkoutSet {
  reps: number;
  rir?: number | null;
  tempoEccSec?: number | null;
  tempoPauseSec?: number | null;
  tempoConcSec?: number | null;
  technique?: string | null;
  loadLbs?: number | null;
}

export interface WorkoutLike {
  date: string | Date;
  sets?: WorkoutSet[];
}

export interface XpSummary {
  totalXp: number;
  weekXp: number;
  level: number;
  xpIntoLevel: number;
  nextLevelXp: number;
  progressPct: number;
  xpToNext: number;
}

const BASE_LEVEL_XP = 500;
const LEVEL_XP_INCREMENT = 100;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function calculateSetXp(set: WorkoutSet): number {
  const reps = Number.isFinite(set.reps) ? set.reps : 0;
  const repPoints = clamp(reps, 0, 15);

  const rir = set.rir;
  const rirBonus =
    typeof rir === 'number'
      ? rir <= 1
        ? 6
        : rir <= 2
        ? 4
        : rir <= 3
        ? 2
        : 0
      : 0;

  const tempoBonus = (set.tempoEccSec && set.tempoEccSec >= 3 ? 3 : 0) +
    (set.tempoPauseSec && set.tempoPauseSec >= 1 ? 2 : 0);
  const techniqueBonus = set.technique && set.technique !== 'none' ? 3 : 0;

  const total = 10 + repPoints + rirBonus + tempoBonus + techniqueBonus;
  return clamp(total, 5, 40);
}

export function calculateWorkoutXp(workout: WorkoutLike): number {
  const sets = workout.sets || [];
  if (sets.length === 0) return 0;
  const setXp = sets.reduce((sum, set) => sum + calculateSetXp(set), 0);
  return setXp + 20; // completion bonus
}

export function calculateXpSummary(workouts: WorkoutLike[]): XpSummary {
  const totalXp = workouts.reduce((sum, workout) => sum + calculateWorkoutXp(workout), 0);
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const weekXp = workouts
    .filter(workout => {
      const date = new Date(workout.date).getTime();
      return Number.isFinite(date) && now - date <= weekMs;
    })
    .reduce((sum, workout) => sum + calculateWorkoutXp(workout), 0);

  let level = 1;
  let xpIntoLevel = totalXp;
  let nextLevelXp = BASE_LEVEL_XP;

  while (xpIntoLevel >= nextLevelXp) {
    xpIntoLevel -= nextLevelXp;
    level += 1;
    nextLevelXp = BASE_LEVEL_XP + (level - 1) * LEVEL_XP_INCREMENT;
  }

  const progressPct = nextLevelXp > 0 ? xpIntoLevel / nextLevelXp : 0;
  const xpToNext = nextLevelXp - xpIntoLevel;

  return {
    totalXp,
    weekXp,
    level,
    xpIntoLevel,
    nextLevelXp,
    progressPct,
    xpToNext,
  };
}
