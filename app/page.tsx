'use client';

import { TodayWorkout } from '@/components/TodayWorkout';

export default function Home() {
  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">Today&apos;s Workout</h1>
      <TodayWorkout />
    </div>
  );
}
