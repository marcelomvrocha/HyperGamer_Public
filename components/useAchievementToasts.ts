'use client';

import { useCallback, useRef } from 'react';
import { apiPath } from '@/lib/app-paths';
import { getAchievements, type Achievement } from '@/lib/achievements';
import { useToast } from '@/components/ToastProvider';

const WORKOUTS_LIMIT = 500;

async function fetchAchievementSnapshot(): Promise<Achievement[]> {
  const response = await fetch(apiPath(`/api/workouts?limit=${WORKOUTS_LIMIT}`), { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch workouts: ${response.statusText}`);
  }
  const workouts = await response.json();
  return getAchievements(workouts);
}

function mapEarnedIds(achievements: Achievement[]) {
  return new Set(achievements.filter(achievement => achievement.earned).map(achievement => achievement.id));
}

export function useAchievementToasts() {
  const { showToast } = useToast();
  const baselineRef = useRef<Set<string> | null>(null);
  const loadingRef = useRef<Promise<void> | null>(null);

  const ensureAchievementBaseline = useCallback(async () => {
    if (baselineRef.current) return;
    if (loadingRef.current) {
      await loadingRef.current;
      return;
    }

    loadingRef.current = (async () => {
      try {
        const achievements = await fetchAchievementSnapshot();
        baselineRef.current = mapEarnedIds(achievements);
      } catch (error) {
        console.error('Error loading achievements baseline:', error);
      } finally {
        loadingRef.current = null;
      }
    })();

    await loadingRef.current;
  }, []);

  const checkForNewAchievements = useCallback(async () => {
    await ensureAchievementBaseline();
    if (!baselineRef.current) return;

    try {
      const achievements = await fetchAchievementSnapshot();
      const earned = achievements.filter(achievement => achievement.earned);
      const nextIds = mapEarnedIds(achievements);
      const newlyUnlocked = earned.filter(achievement => !baselineRef.current?.has(achievement.id));

      if (newlyUnlocked.length > 0) {
        newlyUnlocked.forEach(achievement => {
          showToast({
            title: 'Achievement unlocked',
            description: `${achievement.title} — ${achievement.description}`,
            icon: achievement.icon,
            tone: 'achievement',
            durationMs: 6500,
          });
        });
      }

      baselineRef.current = nextIds;
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  }, [ensureAchievementBaseline, showToast]);

  return { ensureAchievementBaseline, checkForNewAchievements };
}
