'use client';

import { useState, useEffect } from 'react';
import { apiPath } from '@/lib/app-paths';
import {
  Brush,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { calculateXpSummary, type XpSummary } from '@/lib/xp';
import {
  EXERCISES,
  getPerformanceLabel,
  getSequenceDefinition,
  getSequenceExercises,
} from '@/lib/exercises';
import {
  buildDailyPerformanceTimeline,
  buildWeeklyExerciseComparisons,
  extractDateKey,
  parseDateKey,
  type ExerciseWeekComparison,
  type PerformanceTimelinePoint,
} from '@/lib/performance-metrics';

interface Biometric {
  id: string;
  date: string;
  weightKg: number;
  bfPercent?: number;
  lbmKg?: number;
  bmi?: number;
}

interface LBMComparison {
  thisWeek: number | null;
  lastWeek: number | null;
  change: number | null;
  trend: 'up' | 'down' | 'stable' | 'no-data';
}

type TimeRange = 'week' | 'month' | 'all';

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string; description: string }[] = [
  { value: 'week', label: 'Week', description: 'Last 7 days' },
  { value: 'month', label: 'Month', description: 'Last 30 days' },
  { value: 'all', label: 'All-time', description: 'All logged data' },
];

function formatDateKey(dateKey: string, options: Intl.DateTimeFormatOptions): string {
  return parseDateKey(dateKey).toLocaleDateString('en-US', options);
}

const UPPER_EXERCISES = getSequenceExercises('upper', { includeCore: false });
const LOWER_EXERCISES = getSequenceExercises('lower', { includeCore: false });
const CORE_EXERCISES = EXERCISES.filter(exercise => exercise.pattern === 'core');

export default function Progress() {
  const [biometrics, setBiometrics] = useState<Biometric[]>([]);
  const [performance, setPerformance] = useState<PerformanceTimelinePoint[]>([]);
  const [sevenDayAvg, setSevenDayAvg] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [weekComparison, setWeekComparison] = useState<ExerciseWeekComparison[]>([]);
  const [lbmComparison, setLbmComparison] = useState<LBMComparison | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [xpSummary, setXpSummary] = useState<XpSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [bioRes, workoutsRes] = await Promise.all([
        fetch(apiPath('/api/biometrics?limit=all')),
        fetch(apiPath('/api/workouts?all=true&view=compact')),
      ]);
      const [bioData, workouts] = await Promise.all([bioRes.json(), workoutsRes.json()]);
      setBiometrics(bioData);

      const last7Days = bioData.slice(0, 7);
      if (last7Days.length > 0) {
        const avg =
          last7Days.reduce((sum: number, item: Biometric) => sum + item.weightKg, 0) /
          last7Days.length;
        setSevenDayAvg(avg);
      }

      setXpSummary(calculateXpSummary(workouts));

      const performanceData = buildDailyPerformanceTimeline(workouts, EXERCISES, {
        carryForwardMissingValues: true,
      });
      setPerformance(performanceData);

      const comparisons = buildWeeklyExerciseComparisons(workouts, EXERCISES).filter(
        comparison => comparison.thisWeek > 0 || comparison.lastWeek > 0
      );
      setWeekComparison(comparisons);

      let lbmComp: LBMComparison | null = null;
      if (bioData.length >= 2) {
        const thisWeekBio = bioData[0];
        const lastWeekBio = bioData[1];

        if (thisWeekBio.lbmKg && lastWeekBio.lbmKg) {
          const lbmChange = thisWeekBio.lbmKg - lastWeekBio.lbmKg;
          lbmComp = {
            thisWeek: thisWeekBio.lbmKg,
            lastWeek: lastWeekBio.lbmKg,
            change: lbmChange,
            trend: lbmChange > 0.1 ? 'up' : lbmChange < -0.1 ? 'down' : 'stable',
          };
        } else {
          lbmComp = {
            thisWeek: thisWeekBio.lbmKg || null,
            lastWeek: lastWeekBio.lbmKg || null,
            change: null,
            trend: 'no-data',
          };
        }
      }
      setLbmComparison(lbmComp);

      const recs: string[] = [];
      const improving = comparisons.filter(comparison => comparison.trend === 'up').length;
      const declining = comparisons.filter(comparison => comparison.trend === 'down').length;
      const total = comparisons.length;

      if (total === 0) {
        recs.push('Log two distinct training weeks to unlock sequence-specific performance recommendations.');
      } else if (improving >= total * 0.67) {
        recs.push('Excellent progress across most tracked lifts. Keep the current upper/lower split and continue progressive overload.');
      } else if (improving >= total * 0.5) {
        recs.push('More than half of your lifts are improving. Keep the split stable and add focus to the lagging movements.');
      } else if (declining >= total * 0.5) {
        recs.push('Several lifts are trending down. Check sleep, recovery, and whether the sequence volume needs a deload.');
      } else {
        recs.push('Results are mixed. Review exercise execution and prioritize the lifts that have stalled across the split.');
      }

      const laggingExercises = comparisons.filter(comparison => comparison.trend === 'down');
      if (laggingExercises.length > 0) {
        recs.push(
          `Focus areas: ${laggingExercises.map(item => item.label).join(', ')}. Add 1-2 quality sets or tighten tempo before increasing load.`
        );
      }

      const strongExercises = comparisons.filter(
        comparison => comparison.trend === 'up' && comparison.changePercent > 5
      );
      if (strongExercises.length > 0) {
        recs.push(
          `Best movers: ${strongExercises.map(item => item.label).join(', ')}. These are good candidates for extra intensity techniques once reps top out.`
        );
      }

      if (lbmComp && lbmComp.trend === 'up' && lbmComp.change && lbmComp.change > 0.1) {
        recs.push(
          `Lean body mass increased by ${lbmComp.change.toFixed(2)} kg. Maintain the current calorie surplus and keep alternating upper and lower sessions.`
        );
      } else if (lbmComp && lbmComp.trend === 'down' && lbmComp.change && lbmComp.change < -0.1) {
        recs.push(
          `Lean body mass is down ${Math.abs(lbmComp.change).toFixed(2)} kg. If performance is also slipping, reduce fatigue before adding more volume.`
        );
      } else if (lbmComp && lbmComp.trend === 'stable' && lbmComp.change !== null) {
        recs.push('Lean body mass is stable. If lift performance is rising, your current plan is still moving in the right direction.');
      }

      setRecommendations(recs);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-900 dark:text-gray-100">Loading...</div>;
  }

  const rangeStartDate = (() => {
    if (timeRange === 'all') {
      return null;
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (timeRange === 'week' ? 6 : 29));
    return start;
  })();

  const isWithinSelectedRange = (dateKey: string) => {
    if (!rangeStartDate) {
      return true;
    }
    return parseDateKey(dateKey) >= rangeStartDate;
  };

  const allWeightData = biometrics
    .map(item => ({
      date: extractDateKey(item.date),
      'Weight (kg)': item.weightKg,
      'LBM (kg)': item.lbmKg || null,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const weightData = allWeightData.filter(point => isWithinSelectedRange(point.date));
  const performanceData = performance.filter(point => isWithinSelectedRange(point.date));

  const comparisonGroups: Array<{
    key: 'upper' | 'lower' | 'core';
    label: string;
    items: ExerciseWeekComparison[];
  }> = [
    {
      key: 'upper',
      label: getSequenceDefinition('upper').label,
      items: weekComparison.filter(comparison => comparison.group === 'upper'),
    },
    {
      key: 'lower',
      label: getSequenceDefinition('lower').label,
      items: weekComparison.filter(comparison => comparison.group === 'lower'),
    },
    {
      key: 'core',
      label: 'Core',
      items: weekComparison.filter(comparison => comparison.group === 'core'),
    },
  ];

  const renderPerformanceChart = (
    title: string,
    description: string,
    exercises: typeof EXERCISES
  ) => (
    <div className="surface-card p-4 sm:p-6">
      <h2 className="text-xl font-semibold mb-1 text-gray-100 dark:text-gray-100">{title}</h2>
      <p className="text-sm text-gray-300 dark:text-gray-300 mb-4">{description}</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {exercises.map(exercise => (
          <span
            key={exercise.id}
            className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-800/70 px-3 py-1 text-xs text-gray-200"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: exercise.chartColor }}
              aria-hidden
            />
            {getPerformanceLabel(exercise)}
          </span>
        ))}
      </div>
      {performanceData.length > 0 ? (
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={performanceData} margin={{ top: 8, right: 12, left: 2, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value: string) => formatDateKey(value, { month: 'short', day: 'numeric' })}
              interval="preserveStartEnd"
              minTickGap={28}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(value: string) =>
                formatDateKey(value, { year: 'numeric', month: 'long', day: 'numeric' })
              }
            />
            {exercises.map(exercise => (
              <Line
                key={exercise.id}
                type="monotone"
                dataKey={exercise.id}
                name={getPerformanceLabel(exercise)}
                stroke={exercise.chartColor}
                strokeWidth={2}
                dot={false}
              />
            ))}
            {timeRange === 'all' && performanceData.length > 20 && (
              <Brush
                dataKey="date"
                height={24}
                stroke="#3b82f6"
                tickFormatter={(value: string) => formatDateKey(value, { month: 'short', day: 'numeric' })}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-gray-300 dark:text-gray-300">
          No workout entries in this range. Switch to Month or All-time to view more history.
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Progress Dashboard
        </h1>
        <div className="grid w-full grid-cols-1 gap-2 rounded-xl border border-gray-700 bg-gray-800/60 p-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
          {TIME_RANGE_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTimeRange(option.value)}
              className={`rounded-lg px-3 py-2 text-left text-sm transition sm:text-center ${
                timeRange === option.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-900/40 text-gray-300 hover:bg-gray-700'
              }`}
              aria-pressed={timeRange === option.value}
            >
              <span className="block font-medium">{option.label}</span>
              <span className="block text-xs opacity-80">{option.description}</span>
            </button>
          ))}
        </div>
      </div>

      {xpSummary && (
        <div className="surface-card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-100 dark:text-gray-100">Gamer Level</h2>
              <p className="text-3xl font-bold text-blue-400 dark:text-blue-400">Lv {xpSummary.level}</p>
              <p className="text-sm text-gray-400 dark:text-gray-400">
                Total XP: {Math.round(xpSummary.totalXp)}
              </p>
            </div>
            <div className="flex-1 sm:mx-6">
              <div className="w-full bg-gray-700 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.round(xpSummary.progressPct * 100))}%` }}
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-xs text-gray-400 dark:text-gray-400 mt-2">
                <span>
                  {Math.round(xpSummary.xpIntoLevel)} / {Math.round(xpSummary.nextLevelXp)} XP
                </span>
                <span>{Math.round(xpSummary.xpToNext)} XP to next level</span>
              </div>
            </div>
            <div className="text-sm text-gray-300 dark:text-gray-300">
              <p className="font-medium text-gray-200 dark:text-gray-200">Weekly XP</p>
              <p className="text-lg font-semibold">{Math.round(xpSummary.weekXp)}</p>
            </div>
          </div>
        </div>
      )}

      {sevenDayAvg && (
        <div className="surface-card p-4 sm:p-6">
          <h2 className="text-xl font-semibold mb-2 text-gray-100 dark:text-gray-100">
            7-Day Average Weight
          </h2>
          <p className="text-3xl font-bold text-blue-400 dark:text-blue-400">
            {sevenDayAvg.toFixed(2)} kg
          </p>
        </div>
      )}

      <div className="surface-card p-4 sm:p-6">
        <h2 className="text-xl font-semibold mb-1 text-gray-100 dark:text-gray-100">
          Bodyweight & LBM Trend
        </h2>
        <p className="text-sm text-gray-300 dark:text-gray-300 mb-4">
          Showing {weightData.length} {weightData.length === 1 ? 'entry' : 'entries'} in the selected range.
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-800/70 px-3 py-1 text-xs text-gray-200">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" aria-hidden />
            Weight (kg)
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-800/70 px-3 py-1 text-xs text-gray-200">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden />
            LBM (kg)
          </span>
        </div>
        {weightData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={weightData} margin={{ top: 8, right: 12, left: 2, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value: string) => formatDateKey(value, { month: 'short', day: 'numeric' })}
                interval="preserveStartEnd"
                minTickGap={28}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value: string) =>
                  formatDateKey(value, { year: 'numeric', month: 'long', day: 'numeric' })
                }
              />
              <Line
                type="monotone"
                dataKey="Weight (kg)"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="LBM (kg)"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={false}
                connectNulls
                activeDot={{ r: 5 }}
              />
              {timeRange === 'all' && weightData.length > 20 && (
                <Brush
                  dataKey="date"
                  height={24}
                  stroke="#3b82f6"
                  tickFormatter={(value: string) => formatDateKey(value, { month: 'short', day: 'numeric' })}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-300 dark:text-gray-300">
            No bodyweight entries in this range. Switch to Month or All-time to view more history.
          </p>
        )}
      </div>

      {(weekComparison.length > 0 || lbmComparison) && (
        <div className="surface-card p-4 sm:p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-100 dark:text-gray-100">
            Week-over-Week Assessment
          </h2>
          <p className="text-sm text-gray-300 dark:text-gray-300 mb-4">
            Non-trained days keep the previous benchmark, so rest/alternating sequence days do not register as artificial drops.
          </p>

          {lbmComparison && lbmComparison.trend !== 'no-data' && (
            <div
              className={`mb-6 p-4 rounded-lg border-2 ${
                lbmComparison.trend === 'up'
                  ? 'bg-green-900/30 border-green-500 dark:border-green-500'
                  : lbmComparison.trend === 'down'
                    ? 'bg-yellow-900/30 border-yellow-500 dark:border-yellow-500'
                    : 'bg-blue-900/30 border-blue-500 dark:border-blue-500'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                <h3 className="font-semibold text-gray-100 dark:text-gray-100">Lean Body Mass (LBM)</h3>
                {lbmComparison.change !== null && (
                  <span
                    className={`text-lg font-bold ${
                      lbmComparison.trend === 'up'
                        ? 'text-green-300 dark:text-green-300'
                        : lbmComparison.trend === 'down'
                          ? 'text-yellow-300 dark:text-yellow-300'
                          : 'text-blue-300 dark:text-blue-300'
                    }`}
                  >
                    {lbmComparison.change > 0 ? '+' : ''}
                    {lbmComparison.change.toFixed(2)} kg
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400 dark:text-gray-400">This Week: </span>
                  <span className="text-gray-200 dark:text-gray-200 font-medium">
                    {lbmComparison.thisWeek?.toFixed(2)} kg
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 dark:text-gray-400">Last Week: </span>
                  <span className="text-gray-200 dark:text-gray-200 font-medium">
                    {lbmComparison.lastWeek?.toFixed(2)} kg
                  </span>
                </div>
              </div>
            </div>
          )}

          {comparisonGroups
            .filter(group => group.items.length > 0)
            .map(group => (
              <div key={group.key} className="mb-6 last:mb-0">
                <h3 className="font-semibold text-gray-100 dark:text-gray-100 mb-3">{group.label}</h3>
                <div className="space-y-2">
                  {group.items.map(comparison => (
                    <div
                      key={comparison.exerciseId}
                      className="bg-gray-700 dark:bg-gray-700 rounded-lg p-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                        <span className="text-gray-200 dark:text-gray-200 font-medium">
                          {comparison.label}
                        </span>
                        <span
                          className={`text-sm font-semibold ${
                            comparison.trend === 'up'
                              ? 'text-green-300 dark:text-green-300'
                              : comparison.trend === 'down'
                                ? 'text-red-300 dark:text-red-300'
                                : 'text-gray-400 dark:text-gray-400'
                          }`}
                        >
                          {comparison.trend === 'up' ? '↑' : comparison.trend === 'down' ? '↓' : '→'}
                          {comparison.change > 0 ? '+' : ''}
                          {comparison.change}
                          {comparison.changePercent !== 0 &&
                            ` (${comparison.changePercent > 0 ? '+' : ''}${comparison.changePercent.toFixed(1)}%)`}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-400 dark:text-gray-400">
                        <span>This week: {comparison.thisWeek}</span>
                        <span>Last week: {comparison.lastWeek}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

          {recommendations.length > 0 && (
            <div className="bg-blue-900/30 dark:bg-blue-900/30 border border-blue-500 dark:border-blue-500 rounded-lg p-4">
              <h3 className="font-semibold text-blue-300 dark:text-blue-300 mb-3">💡 Recommendations</h3>
              <ul className="space-y-2">
                {recommendations.map((recommendation, index) => (
                  <li key={index} className="text-sm text-gray-200 dark:text-gray-200">
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {renderPerformanceChart(
        'Upper Body Performance',
        `Showing ${performanceData.length} training days in range for the ${getSequenceDefinition('upper').label.toLowerCase()} sequence. Non-trained days keep the previous benchmark.`,
        UPPER_EXERCISES
      )}

      {renderPerformanceChart(
        'Lower Body Performance',
        `Showing ${performanceData.length} training days in range for the ${getSequenceDefinition('lower').label.toLowerCase()} sequence. Non-trained days keep the previous benchmark.`,
        LOWER_EXERCISES
      )}

      {renderPerformanceChart(
        'Core Performance',
        'Shared ab work appears in both sequences and is tracked separately here.',
        CORE_EXERCISES
      )}

      <div className="surface-card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-4">
          <h2 className="text-xl font-semibold text-gray-100 dark:text-gray-100">Latest Biometrics</h2>
          {biometrics.length > 0 && biometrics[0].date && (
            <p className="text-sm text-gray-400 dark:text-gray-400">
              {formatDateKey(extractDateKey(biometrics[0].date), {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
        </div>
        {biometrics.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-300 dark:text-gray-300">Weight</p>
              <p className="text-lg font-semibold text-gray-100 dark:text-gray-100">
                {biometrics[0].weightKg.toFixed(1)} kg
              </p>
            </div>
            {biometrics[0].bfPercent && (
              <div>
                <p className="text-sm text-gray-300 dark:text-gray-300">BF%</p>
                <p className="text-lg font-semibold text-gray-100 dark:text-gray-100">
                  {biometrics[0].bfPercent.toFixed(1)}%
                </p>
              </div>
            )}
            {biometrics[0].lbmKg && (
              <div>
                <p className="text-sm text-gray-300 dark:text-gray-300">LBM</p>
                <p className="text-lg font-semibold text-gray-100 dark:text-gray-100">
                  {biometrics[0].lbmKg.toFixed(1)} kg
                </p>
              </div>
            )}
            {biometrics[0].bmi && (
              <div>
                <p className="text-sm text-gray-300 dark:text-gray-300">BMI</p>
                <p className="text-lg font-semibold text-gray-100 dark:text-gray-100">
                  {biometrics[0].bmi.toFixed(1)}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-300 dark:text-gray-300">
            No biometrics data yet. Log weekly measurements to track progress.
          </p>
        )}
      </div>
    </div>
  );
}
