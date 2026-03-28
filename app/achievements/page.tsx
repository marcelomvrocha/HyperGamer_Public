'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiPath } from '@/lib/app-paths';
import { getAchievements, type Achievement } from '@/lib/achievements';

type Category = {
  id: string;
  title: string;
  description?: string;
  match: (achievement: Achievement) => boolean;
};

const CATEGORIES: Category[] = [
  {
    id: 'foundations',
    title: 'Spawn Protocol',
    description: 'Your first login to the training campaign.',
    match: achievement => achievement.id === 'first-log',
  },
  {
    id: 'workout-milestones',
    title: 'Main Quest Progress',
    description: 'Total workout quests completed.',
    match: achievement => achievement.id.startsWith('workout-milestone-'),
  },
  {
    id: 'set-volume',
    title: 'Forge Volume',
    description: 'Total working sets forged across your run.',
    match: achievement => achievement.id.startsWith('set-forge-'),
  },
  {
    id: 'streaks',
    title: 'Combo Chains',
    description: 'Consecutive training-day combos.',
    match: achievement => achievement.id.startsWith('streak-'),
  },
  {
    id: 'weekly-warrior',
    title: 'Weekly Raids',
    description: 'Quests cleared in the last 7 days.',
    match: achievement => achievement.id.startsWith('week-warrior-'),
  },
  {
    id: 'monthly-march',
    title: 'Monthly Campaign',
    description: 'Quests completed in the last 30 days.',
    match: achievement => achievement.id.startsWith('month-march-'),
  },
  {
    id: 'tempo',
    title: 'Rhythm Engine',
    description: 'Slow eccentrics and beat-locked sessions.',
    match: achievement =>
      achievement.id.startsWith('tempo-sets-') || achievement.id.startsWith('tempo-sessions-'),
  },
  {
    id: 'rir',
    title: 'Tactical Reserve',
    description: 'Clutch sets at RIR 2 or lower.',
    match: achievement =>
      achievement.id.startsWith('rir-sets-') || achievement.id.startsWith('rir-sessions-'),
  },
  {
    id: 'technique',
    title: 'Tech Tree Trials',
    description: 'Rest-pause, myo-reps, and advanced combat methods.',
    match: achievement =>
      achievement.id.startsWith('technique-sets-') || achievement.id.startsWith('technique-sessions-'),
  },
  {
    id: 'precision',
    title: 'Frame-Perfect',
    description: 'Tempo + RIR mastery combos.',
    match: achievement => achievement.id.startsWith('precision-sets-'),
  },
  {
    id: 'training-days',
    title: 'Checkpoint Days',
    description: 'Unique days you showed up and saved progress.',
    match: achievement => achievement.id.startsWith('training-days-'),
  },
  {
    id: 'pattern-peaks',
    title: 'Pattern Boss Peaks',
    description: 'Best single-set reps by movement class.',
    match: achievement => achievement.id.startsWith('pattern-'),
  },
  {
    id: 'exercise-specialists',
    title: 'Exercise Specialists',
    description: 'Progress tiers for each individual exercise in your library.',
    match: achievement => achievement.id.startsWith('exercise-'),
  },
];

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAchievements() {
      try {
        const response = await fetch(apiPath('/api/workouts?limit=500'));
        const workouts: Parameters<typeof getAchievements>[0] = await response.json();
        setAchievements(getAchievements(workouts));
      } catch (error) {
        console.error('Error loading achievements:', error);
      } finally {
        setLoading(false);
      }
    }

    loadAchievements();
  }, []);

  const grouped = useMemo(() => {
    return CATEGORIES.map(category => {
      const items = achievements.filter(category.match);
      return {
        ...category,
        items: items.sort((a, b) => Number(b.earned) - Number(a.earned) || a.title.localeCompare(b.title)),
      };
    }).filter(category => category.items.length > 0);
  }, [achievements]);

  useEffect(() => {
    if (grouped.length === 0) return;
    if (Object.keys(expanded).length > 0) return;
    const initial: Record<string, boolean> = {};
    grouped.forEach((category, index) => {
      initial[category.id] = index < 2;
    });
    setExpanded(initial);
  }, [grouped, expanded]);

  const totalUnlocked = achievements.filter(a => a.earned).length;
  const totalCount = achievements.length;
  const completionPct = totalCount > 0 ? Math.round((totalUnlocked / totalCount) * 100) : 0;

  if (loading) {
    return <div className="text-center py-8 text-gray-900 dark:text-gray-100">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Achievements</h1>

      <div className="surface-card p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-400 dark:text-gray-400">Trophy Progress</p>
            <p className="text-3xl font-bold text-blue-400 dark:text-blue-400">
              {totalUnlocked} / {totalCount}
            </p>
          </div>
          <div className="flex-1 sm:px-6">
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-xs text-gray-400 mt-2">
              <span>{completionPct}% complete</span>
              <span>{totalCount - totalUnlocked} to go</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:flex gap-2">
            <button
              type="button"
              onClick={() => {
                const next: Record<string, boolean> = {};
                grouped.forEach(category => {
                  next[category.id] = true;
                });
                setExpanded(next);
              }}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Expand All
            </button>
            <button
              type="button"
              onClick={() => {
                const next: Record<string, boolean> = {};
                grouped.forEach(category => {
                  next[category.id] = false;
                });
                setExpanded(next);
              }}
              className="w-full sm:w-auto px-4 py-2 bg-gray-700 text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-600"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {grouped.map(category => {
        const unlocked = category.items.filter(item => item.earned).length;
        const progressPct = category.items.length > 0 ? Math.round((unlocked / category.items.length) * 100) : 0;
        const isOpen = expanded[category.id] ?? false;

        return (
          <div key={category.id} className="surface-card p-4 sm:p-6">
            <button
              type="button"
              onClick={() =>
                setExpanded(prev => ({
                  ...prev,
                  [category.id]: !isOpen,
                }))
              }
              className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-left"
            >
              <div>
                <h2 className="text-2xl font-semibold text-gray-100 dark:text-gray-100">{category.title}</h2>
                {category.description && (
                  <p className="text-sm text-gray-400 dark:text-gray-400">{category.description}</p>
                )}
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 text-sm text-gray-300">
                <span>
                  {unlocked}/{category.items.length}
                </span>
                <span className="text-gray-500">{isOpen ? '−' : '+'}</span>
              </div>
            </button>

            <div className="mt-3">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{progressPct}% unlocked</span>
                <span>{category.items.length - unlocked} remaining</span>
              </div>
            </div>

            {isOpen && (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.items.map(item => (
                  <div
                    key={item.id}
                    className={`rounded-lg border p-4 ${
                      item.earned
                        ? 'bg-green-900/30 border-green-500'
                        : 'bg-gray-700/60 border-gray-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{item.icon}</div>
                      <div>
                        <p className="font-semibold text-gray-100">{item.title}</p>
                        <p className="text-sm text-gray-300">{item.description}</p>
                      </div>
                    </div>

                    {item.goal !== undefined && (
                      <div className="mt-3">
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${Math.min(100, Math.round(((item.progress || 0) / item.goal) * 100))}%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>{item.progress || 0} / {item.goal}</span>
                          {!item.earned && <span>In progress</span>}
                        </div>
                      </div>
                    )}

                    {item.earnedAt && (
                      <p className="mt-2 text-xs text-gray-400">Unlocked: {item.earnedAt}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {grouped.length === 0 && (
        <div className="surface-card p-6">
          <p className="text-gray-300 dark:text-gray-300">
            Log your first workout to start unlocking achievements.
          </p>
        </div>
      )}
    </div>
  );
}
