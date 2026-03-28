import { prisma } from './prisma';
import { EXERCISES } from './exercises';
import { buildWeeklyExerciseComparisons } from './performance-metrics';

export interface PerformanceKPI {
  name: string;
  currentWeek: number;
  lastWeek: number;
  trend: 'up' | 'down' | 'stable';
}

export interface DecisionOutput {
  caloriesChange: number; // +150, -100, 0, etc.
  addSetsPattern?: string; // 'pull', 'push', 'hinge', 'squat'
  deload: boolean;
  reasoning: string[];
}

/**
 * Rule 1: Weight trend check (weekly)
 * If average is not rising by 0.15-0.30 kg/week for 2 consecutive weeks:
 * Output: Increase calories +150-200/day
 */
async function checkWeightTrend(userId: string): Promise<{ change: number; needsIncrease: boolean }> {
  const biometrics = await prisma.biometricsWeekly.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 3, // Last 3 weeks
  });

  if (biometrics.length < 2) {
    return { change: 0, needsIncrease: false };
  }

  const currentWeek = biometrics[0].weightKg;
  const twoWeeksAgo = biometrics[biometrics.length >= 3 ? 2 : 1].weightKg;
  const change = currentWeek - twoWeeksAgo;
  const weeklyRate = change / (biometrics.length >= 3 ? 2 : 1);

  // Target: 0.15-0.30 kg/week
  const needsIncrease = weeklyRate < 0.15;

  return { change: weeklyRate, needsIncrease };
}

/**
 * Rule 2: Performance check (per lift family)
 * KPIs:
 * - Pulling: total pull-up reps
 * - Pressing: floor press best set
 * - Legs: split squat reps (bottom pause)
 */
async function checkPerformanceKPIs(userId: string): Promise<{
  kpis: PerformanceKPI[];
  laggingPatterns: string[];
}> {
  const lastTwoWeeks = await prisma.workout.findMany({
    where: {
      userId,
      date: {
        gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      },
    },
    include: {
      sets: {
        include: {
          exercise: true,
        },
      },
    },
    orderBy: { date: 'desc' },
  });

  // Group by week
  const thisWeek = lastTwoWeeks.filter(
    w => new Date(w.date).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
  );
  const lastWeek = lastTwoWeeks.filter(
    w => new Date(w.date).getTime() <= Date.now() - 7 * 24 * 60 * 60 * 1000 &&
      new Date(w.date).getTime() > Date.now() - 14 * 24 * 60 * 60 * 1000
  );

  const comparisons = buildWeeklyExerciseComparisons(
    [...thisWeek, ...lastWeek],
    EXERCISES.filter(exercise => exercise.pattern !== 'core')
  ).filter(comparison => comparison.thisWeek > 0 || comparison.lastWeek > 0);

  const kpis: PerformanceKPI[] = comparisons.map(comparison => ({
    name: comparison.label,
    currentWeek: comparison.thisWeek,
    lastWeek: comparison.lastWeek,
    trend: comparison.trend,
  }));

  const laggingPatterns = Array.from(
    new Set(
      comparisons
        .filter(comparison => comparison.trend !== 'up')
        .map(comparison => comparison.pattern)
    )
  );

  return { kpis, laggingPatterns };
}

/**
 * Rule 3: Fatigue marker
 * If performance down 2 sessions in a row on main lifts AND sleep/HR/motivation markers exist
 */
async function checkFatigue(userId: string): Promise<boolean> {
  // Simplified: if performance declining for 2+ weeks
  const { kpis } = await checkPerformanceKPIs(userId);
  const decliningCount = kpis.filter(k => k.trend === 'down').length;
  return decliningCount >= 2;
}

/**
 * Main decision engine
 */
export async function generateDecision(userId: string): Promise<DecisionOutput> {
  const weightTrend = await checkWeightTrend(userId);
  const performance = await checkPerformanceKPIs(userId);
  const fatigue = await checkFatigue(userId);

  const decision: DecisionOutput = {
    caloriesChange: 0,
    deload: false,
    reasoning: [],
  };

  // Rule 1: Weight trend
  if (weightTrend.needsIncrease) {
    decision.caloriesChange = 175; // Middle of 150-200 range
    decision.reasoning.push(
      `Weight gain rate (${(weightTrend.change * 1000).toFixed(0)}g/week) below target (150-300g/week). Increase calories by +175/day.`
    );
  }

  // Rule 3: Fatigue check (takes priority)
  if (fatigue) {
    decision.deload = true;
    decision.caloriesChange = 0; // Override weight trend if fatigued
    decision.reasoning.push('Performance declining for 2+ weeks. Deload week recommended (reduce sets 40-50%).');
    return decision;
  }

  // Rule 2: Performance check
  const improvingCount = performance.kpis.filter(k => k.trend === 'up').length;
  const totalKPIs = performance.kpis.length;
  if (totalKPIs === 0) {
    decision.reasoning.push('Not enough recent sequence data yet. Log two weeks of upper/lower sessions to unlock lift-based recommendations.');
    return decision;
  }

  if (improvingCount < totalKPIs * 0.5) {
    // Less than 50% improving
    const laggingPattern = performance.laggingPatterns[0] || 'pull';
    decision.addSetsPattern = laggingPattern;
    decision.reasoning.push(
      `${totalKPIs - improvingCount} of ${totalKPIs} KPIs not improving. Add 2 sets/week to ${laggingPattern} pattern.`
    );
  } else {
    decision.reasoning.push(`${improvingCount} of ${totalKPIs} KPIs improving. Maintain current programming.`);
  }

  return decision;
}
