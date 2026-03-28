import { EXERCISES } from './exercises';
import type { WorkoutLike, WorkoutSet } from './xp';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  progress?: number;
  goal?: number;
  earnedAt?: string;
}

interface WorkoutSetWithExercise extends WorkoutSet {
  exercise?: {
    name?: string;
    pattern?: string;
  } | null;
}

type Pattern = 'push' | 'pull' | 'hinge' | 'squat' | 'core';
type ExerciseIconPattern = Pattern;

const EXERCISE_SET_TIERS_BASE = [10, 25, 50];
const EXERCISE_SET_TIERS_EXTENDED = [10, 25, 50, 100];
const EXERCISE_SET_EXTENDED_COUNT = 8; // 8*4 + 6*3 = 50 total exercise-based achievements with current library

const WORKOUT_MILESTONE_TITLES: Record<number, string> = {
  3: 'Tutorial Clear',
  5: 'Side Quest Starter',
  10: 'Main Quest Unlocked',
  15: 'Fear Protocol',
  20: 'Curiosity Mode Online',
  30: 'Peak Climber',
  40: 'Connection Courier',
  50: 'Rhythm Rush',
  75: 'Rune Farmer',
  100: 'Puzzle Sage',
  150: 'Neon Strategist',
  200: 'Boss Loop Breaker',
  300: 'New Game Plus',
  500: 'Mythic Lifter',
};

const SET_FORGE_TITLES: Record<number, string> = {
  25: 'Loadout Builder',
  50: 'Forge Apprentice',
  100: 'Combo Blacksmith',
  150: 'Volume Armorer',
  200: 'DPS Architect',
  300: 'Dungeon Engineer',
  400: 'Raid Constructor',
  500: 'Meta Forge Master',
  750: 'Mythic Foundry',
  1000: 'Forgecore Overlord',
};

const STREAK_TITLES: Record<number, string> = {
  2: 'Back-to-Back Buff',
  3: 'Combo Chain x3',
  4: 'No-Skip Protocol',
  5: 'Momentum Locked',
  7: 'Weekly Streaklord',
  10: 'Ten-Day Raid',
  14: 'Fortnight Fortress',
  21: 'Habit Immortal',
};

const WEEK_WARRIOR_TITLES: Record<number, string> = {
  3: 'Mini-Boss Week',
  4: 'Elite Week Clear',
  5: 'Heroic Week Clear',
  6: 'Mythic Week Clear',
};

const MONTH_MARCH_TITLES: Record<number, string> = {
  8: 'Chapter Runner',
  12: 'Season Climber',
  16: 'Campaign Grinder',
  20: 'Endgame Routine',
  24: 'Legendary Month Clear',
};

const TEMPO_SETS_TITLES: Record<number, string> = {
  10: 'Slow-Mo Cadet',
  20: 'Beatkeeper',
  30: 'Time-Dilation Adept',
  40: 'Rhythm Striker',
  60: 'Chrono Commander',
  80: 'Time-Lock Legend',
};

const RIR_SETS_TITLES: Record<number, string> = {
  10: 'HP Bar Reader',
  20: 'Margin Guardian',
  30: 'Clutch Calculator',
  40: 'Boss HP Analyst',
  60: 'Edgewalker Elite',
  80: 'Limit-Break Tactician',
};

const TECHNIQUE_SETS_TITLES: Record<number, string> = {
  1: 'Tech Tree Unlocked',
  5: 'Technique Crafter',
  10: 'Combo Scientist',
  20: 'Lab Boss',
  30: 'Meta Alchemist',
};

const TEMPO_SESSIONS_TITLES: Record<number, string> = {
  3: 'Rhythm Bootcamp',
  5: 'Beat Mode Online',
  10: 'Groove Protocol',
  20: 'Maestro Campaign',
};

const RIR_SESSIONS_TITLES: Record<number, string> = {
  3: 'Tactical Bootcamp',
  5: 'Strategy Online',
  10: 'Combat Analyst',
  20: 'Grandmaster Planner',
};

const TRAINING_DAYS_TITLES: Record<number, string> = {
  5: 'Checkpoint Habit',
  10: 'Save File Stable',
  20: 'Daily Quest Veteran',
  30: 'Campaign Consistent',
  50: 'Stamina Legend',
  75: 'Unstoppable Run',
};

const TECHNIQUE_SESSIONS_TITLES: Record<number, string> = {
  3: 'Experiment Run',
  5: 'Spec Build Online',
  10: 'Technique Campaign Clear',
};

const PRECISION_SETS_TITLES: Record<number, string> = {
  5: 'Focus Beam',
  10: 'Frame-Perfect Form',
  20: 'Precision Combo',
  30: 'Surgical DPS',
};

const PATTERN_PEAK_TITLES: Record<Exclude<Pattern, 'core'>, Record<number, string>> = {
  pull: {
    8: 'Grapple Initiate',
    10: 'Hookshot Adept',
    12: 'Gravity Reeler',
    15: 'Titan Puller',
    20: 'Black-Hole Pull',
  },
  push: {
    8: 'Shield Bash Initiate',
    10: 'Vanguard Press',
    12: 'Siege Breaker',
    15: 'Paladin Overdrive',
    20: 'Titan Launcher',
  },
  hinge: {
    8: 'Hinge Reactor',
    10: 'Deadlift Circuit',
    12: 'Gearshift Power',
    15: 'Torque Overload',
    20: 'Mech-Core Destroyer',
  },
  squat: {
    8: 'Base Camp Builder',
    10: 'Summit Strider',
    12: 'Mountain Engine',
    15: 'Peak Conqueror',
    20: 'Avalanche Titan',
  },
};

function getTierTitle(titles: Record<number, string>, tier: number, fallback: string) {
  return titles[tier] ?? `${fallback}: ${tier}`;
}

function normalizeDateOnly(dateInput: string | Date): Date | null {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDate(dateInput?: string | Date | null) {
  if (!dateInput) return undefined;
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getUniqueWorkoutDays(workouts: WorkoutLike[]) {
  const unique = new Map<string, Date>();
  workouts.forEach(workout => {
    const date = normalizeDateOnly(workout.date);
    if (!date) return;
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    if (!unique.has(key)) {
      unique.set(key, date);
    }
  });
  return Array.from(unique.values()).sort((a, b) => a.getTime() - b.getTime());
}

function getLongestStreak(workoutDays: Date[]) {
  if (workoutDays.length === 0) return 0;
  let longest = 1;
  let current = 1;
  for (let i = 1; i < workoutDays.length; i += 1) {
    const diffDays = (workoutDays[i].getTime() - workoutDays[i - 1].getTime()) / (24 * 60 * 60 * 1000);
    if (diffDays === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else if (diffDays > 1) {
      current = 1;
    }
  }
  return longest;
}

function createTieredAchievements({
  idPrefix,
  tiers,
  value,
  icon,
  title,
  description,
}: {
  idPrefix: string;
  tiers: number[];
  value: number;
  icon: string;
  title: (tier: number, index: number) => string;
  description: (tier: number) => string;
}): Achievement[] {
  return tiers.map((tier, index) => ({
    id: `${idPrefix}-${tier}`,
    title: title(tier, index),
    description: description(tier),
    icon,
    earned: value >= tier,
    progress: Math.min(value, tier),
    goal: tier,
  }));
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
  return normalizePattern(set.exercise?.pattern) || matchExercisePattern(set.exercise?.name);
}

function normalizeExerciseKey(name?: string | null): string {
  if (!name) return '';
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function resolveExerciseIdFromName(name?: string | null): string | null {
  const normalized = normalizeExerciseKey(name);
  if (!normalized) return null;
  const direct = EXERCISES.find(exercise => normalizeExerciseKey(exercise.name) === normalized);
  if (direct) return direct.id;
  const fuzzy = EXERCISES.find(exercise => {
    const target = normalizeExerciseKey(exercise.name);
    return normalized.includes(target) || target.includes(normalized);
  });
  return fuzzy?.id ?? null;
}

function createExerciseSetAchievements(
  exerciseSetCounts: Record<string, number>
): Achievement[] {
  const patternIcons: Record<ExerciseIconPattern, string> = {
    push: '🛡️',
    pull: '🧲',
    hinge: '⚙️',
    squat: '🏔️',
    core: '🌀',
  };

  return EXERCISES.flatMap((exercise, index) => {
    const tiers = index < EXERCISE_SET_EXTENDED_COUNT ? EXERCISE_SET_TIERS_EXTENDED : EXERCISE_SET_TIERS_BASE;
    const value = exerciseSetCounts[exercise.id] ?? 0;
    return createTieredAchievements({
      idPrefix: `exercise-${exercise.id}`,
      tiers,
      value,
      icon: patternIcons[exercise.pattern],
      title: (_tier, tierIndex) => `${exercise.name} Specialist ${tierIndex + 1}`,
      description: tier => `Log ${tier} sets for ${exercise.name}.`,
    });
  });
}

export function getAchievements(workouts: WorkoutLike[]): Achievement[] {
  const totalWorkouts = workouts.length;
  const totalSets = workouts.reduce((sum, workout) => sum + (workout.sets?.length || 0), 0);
  const setsTempo = workouts.reduce(
    (sum, workout) => sum + (workout.sets?.filter(set => (set.tempoEccSec || 0) >= 3).length || 0),
    0
  );
  const setsRir = workouts.reduce(
    (sum, workout) => sum + (workout.sets?.filter(set => typeof set.rir === 'number' && set.rir <= 2).length || 0),
    0
  );
  const setsTechnique = workouts.reduce(
    (sum, workout) => sum + (workout.sets?.filter(set => set.technique && set.technique !== 'none').length || 0),
    0
  );
  const precisionSets = workouts.reduce(
    (sum, workout) =>
      sum +
      (workout.sets?.filter(
        set => (set.tempoEccSec || 0) >= 3 && typeof set.rir === 'number' && set.rir <= 2
      ).length || 0),
    0
  );

  const tempoWorkouts = workouts.filter(workout =>
    workout.sets?.some(set => (set.tempoEccSec || 0) >= 3)
  ).length;
  const rirWorkouts = workouts.filter(workout =>
    workout.sets?.some(set => typeof set.rir === 'number' && set.rir <= 2)
  ).length;
  const techniqueWorkouts = workouts.filter(workout =>
    workout.sets?.some(set => set.technique && set.technique !== 'none')
  ).length;

  const now = Date.now();
  const last7 = workouts.filter(workout => {
    const date = new Date(workout.date).getTime();
    return Number.isFinite(date) && now - date <= 7 * 24 * 60 * 60 * 1000;
  }).length;
  const last30 = workouts.filter(workout => {
    const date = new Date(workout.date).getTime();
    return Number.isFinite(date) && now - date <= 30 * 24 * 60 * 60 * 1000;
  }).length;

  const workoutDays = getUniqueWorkoutDays(workouts);
  const longestStreak = getLongestStreak(workoutDays);
  const uniqueDays = workoutDays.length;

  const patternBest: Record<Exclude<Pattern, 'core'>, number> = {
    pull: 0,
    push: 0,
    hinge: 0,
    squat: 0,
  };

  workouts.forEach(workout => {
    (workout.sets as WorkoutSetWithExercise[] | undefined)?.forEach(set => {
      const pattern = getPatternForSet(set);
      if (!pattern || pattern === 'core') return;
      const reps = Number.isFinite(set.reps) ? set.reps : 0;
      if (reps > patternBest[pattern]) {
        patternBest[pattern] = reps;
      }
    });
  });

  const exerciseSetCounts: Record<string, number> = Object.fromEntries(
    EXERCISES.map(exercise => [exercise.id, 0])
  );
  workouts.forEach(workout => {
    (workout.sets as WorkoutSetWithExercise[] | undefined)?.forEach(set => {
      const exerciseId = resolveExerciseIdFromName(set.exercise?.name);
      if (!exerciseId) return;
      exerciseSetCounts[exerciseId] = (exerciseSetCounts[exerciseId] ?? 0) + 1;
    });
  });

  const earliestWorkoutDate = workouts
    .map(workout => normalizeDateOnly(workout.date))
    .filter((date): date is Date => Boolean(date))
    .sort((a, b) => a.getTime() - b.getTime())[0];

  const achievements: Achievement[] = [
    {
      id: 'first-log',
      title: 'Spawn Point Activated',
      description: 'Complete your first logged workout.',
      icon: '🏁',
      earned: totalWorkouts >= 1,
      earnedAt: formatDate(earliestWorkoutDate),
    },
  ];

  achievements.push(
    ...createTieredAchievements({
      idPrefix: 'workout-milestone',
      tiers: [3, 5, 10, 15, 20, 30, 40, 50, 75, 100, 150, 200, 300, 500],
      value: totalWorkouts,
      icon: '🏋️',
      title: tier => getTierTitle(WORKOUT_MILESTONE_TITLES, tier, 'Workout Milestone'),
      description: tier => `Log ${tier} workouts total.`,
    }),
    ...createTieredAchievements({
      idPrefix: 'set-forge',
      tiers: [25, 50, 100, 150, 200, 300, 400, 500, 750, 1000],
      value: totalSets,
      icon: '🧱',
      title: tier => getTierTitle(SET_FORGE_TITLES, tier, 'Set Forge'),
      description: tier => `Accumulate ${tier} total working sets.`,
    }),
    ...createTieredAchievements({
      idPrefix: 'streak',
      tiers: [2, 3, 4, 5, 7, 10, 14, 21],
      value: longestStreak,
      icon: '🔥',
      title: tier => getTierTitle(STREAK_TITLES, tier, 'Streak'),
      description: tier => `Train ${tier} days in a row.`,
    }),
    ...createTieredAchievements({
      idPrefix: 'week-warrior',
      tiers: [3, 4, 5, 6],
      value: last7,
      icon: '⚔️',
      title: tier => getTierTitle(WEEK_WARRIOR_TITLES, tier, 'Week Warrior'),
      description: tier => `Log ${tier} workouts in the last 7 days.`,
    }),
    ...createTieredAchievements({
      idPrefix: 'month-march',
      tiers: [8, 12, 16, 20, 24],
      value: last30,
      icon: '🧭',
      title: tier => getTierTitle(MONTH_MARCH_TITLES, tier, 'Monthly March'),
      description: tier => `Log ${tier} workouts in the last 30 days.`,
    }),
    ...createTieredAchievements({
      idPrefix: 'tempo-sets',
      tiers: [10, 20, 30, 40, 60, 80],
      value: setsTempo,
      icon: '⏱️',
      title: tier => getTierTitle(TEMPO_SETS_TITLES, tier, 'Tempo Mastery'),
      description: tier => `Complete ${tier} sets with 3s+ eccentrics.`,
    }),
    ...createTieredAchievements({
      idPrefix: 'rir-sets',
      tiers: [10, 20, 30, 40, 60, 80],
      value: setsRir,
      icon: '🎯',
      title: tier => getTierTitle(RIR_SETS_TITLES, tier, 'RIR Discipline'),
      description: tier => `Log ${tier} sets at RIR 2 or lower.`,
    }),
    ...createTieredAchievements({
      idPrefix: 'technique-sets',
      tiers: [1, 5, 10, 20, 30],
      value: setsTechnique,
      icon: '🧪',
      title: tier => getTierTitle(TECHNIQUE_SETS_TITLES, tier, 'Technique Trial'),
      description: tier => `Perform ${tier} intensity technique sets.`,
    }),
    ...createTieredAchievements({
      idPrefix: 'tempo-sessions',
      tiers: [3, 5, 10, 20],
      value: tempoWorkouts,
      icon: '🕰️',
      title: tier => getTierTitle(TEMPO_SESSIONS_TITLES, tier, 'Tempo Sessions'),
      description: tier => `Log ${tier} workouts with tempo work.`,
    }),
    ...createTieredAchievements({
      idPrefix: 'rir-sessions',
      tiers: [3, 5, 10, 20],
      value: rirWorkouts,
      icon: '🧠',
      title: tier => getTierTitle(RIR_SESSIONS_TITLES, tier, 'RIR Sessions'),
      description: tier => `Log ${tier} workouts with RIR tracking.`,
    }),
    ...createTieredAchievements({
      idPrefix: 'training-days',
      tiers: [5, 10, 20, 30, 50, 75],
      value: uniqueDays,
      icon: '📅',
      title: tier => getTierTitle(TRAINING_DAYS_TITLES, tier, 'Training Days'),
      description: tier => `Train on ${tier} unique days.`,
    }),
    ...createTieredAchievements({
      idPrefix: 'technique-sessions',
      tiers: [3, 5, 10],
      value: techniqueWorkouts,
      icon: '✨',
      title: tier => getTierTitle(TECHNIQUE_SESSIONS_TITLES, tier, 'Technique Sessions'),
      description: tier => `Log ${tier} workouts using intensity techniques.`,
    }),
    ...createTieredAchievements({
      idPrefix: 'precision-sets',
      tiers: [5, 10, 20, 30],
      value: precisionSets,
      icon: '⚡',
      title: tier => getTierTitle(PRECISION_SETS_TITLES, tier, 'Precision Sets'),
      description: tier => `Log ${tier} sets with tempo + RIR precision.`,
    })
  );

  const patternIcons: Record<'pull' | 'push' | 'hinge' | 'squat', string> = {
    pull: '🧲',
    push: '🛡️',
    hinge: '⚙️',
    squat: '🏔️',
  };

  const patternLabels: Record<'pull' | 'push' | 'hinge' | 'squat', string> = {
    pull: 'Pull',
    push: 'Push',
    hinge: 'Hinge',
    squat: 'Squat',
  };

  const repTiers = [8, 10, 12, 15, 20];

  (Object.keys(patternBest) as Array<keyof typeof patternBest>).forEach(pattern => {
    achievements.push(
      ...createTieredAchievements({
        idPrefix: `pattern-${pattern}`,
        tiers: repTiers,
        value: patternBest[pattern],
        icon: patternIcons[pattern],
        title: tier => getTierTitle(PATTERN_PEAK_TITLES[pattern], tier, `${patternLabels[pattern]} Peak`),
        description: tier => `Hit ${tier}+ reps in any ${patternLabels[pattern].toLowerCase()} set.`,
      })
    );
  });

  achievements.push(...createExerciseSetAchievements(exerciseSetCounts));

  return achievements;
}
