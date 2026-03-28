'use client';

import { TodayWorkout } from '@/components/TodayWorkout';

export default function LogWorkout() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Log Workout
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Use the same upper/lower sequence workflow as Today.
        </p>
      </div>

      <TodayWorkout />
    </div>
  );
}
