'use client';

import { useState } from 'react';

export function HypertrophyGuide() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4 sm:p-6 mb-6">
      <div className="flex items-center justify-between gap-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-2xl">💪</div>
          <div>
            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">
              Hypertrophy Progression Strategy
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              How to build lean muscle mass (Click to expand)
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-blue-600 dark:text-blue-400 transform transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {expanded && (
        <div className="mt-6 space-y-6">
          {/* Rep Range Strategy */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-blue-200 dark:border-blue-700">
            <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              📊 Rep Range Progression (8-12 Range)
            </h4>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Start */}
                <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-4 border-2 border-green-300 dark:border-green-700">
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="font-bold text-green-900 dark:text-green-100 text-lg mb-1">Start Here</div>
                  <div className="text-3xl font-bold text-green-800 dark:text-green-200 mb-2">8 Reps</div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Begin at lower end of range. Focus on perfect form.
                  </p>
                </div>

                {/* Progress */}
                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-4 border-2 border-blue-300 dark:border-blue-700">
                  <div className="text-2xl mb-2">⬆️</div>
                  <div className="font-bold text-blue-900 dark:text-blue-100 text-lg mb-1">Progress</div>
                  <div className="text-3xl font-bold text-blue-800 dark:text-blue-200 mb-2">8 → 12</div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Add 1 rep per set each session until you reach 12.
                  </p>
                </div>

                {/* Add Intensity */}
                <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-4 border-2 border-purple-300 dark:border-purple-700">
                  <div className="text-2xl mb-2">🔥</div>
                  <div className="font-bold text-purple-900 dark:text-purple-100 text-lg mb-1">Maxed Out?</div>
                  <div className="text-3xl font-bold text-purple-800 dark:text-purple-200 mb-2">12+ Reps</div>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Add tempo, pause, or intensity techniques.
                  </p>
                </div>
              </div>

              {/* Visual Rep Range Bar */}
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Target Zone:</p>
                <div className="relative h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">6</span>
                  </div>
                  <div className="absolute left-[25%] right-0 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 h-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">8-12 REP RANGE (HYPERTROPHY ZONE)</span>
                  </div>
                  <div className="absolute left-0 right-[75%] bg-gray-300 dark:bg-gray-600 h-full"></div>
                  <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end pr-2">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">20+</span>
                  </div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-600 dark:text-gray-400">
                  <span>Strength</span>
                  <span className="font-bold">Hypertrophy</span>
                  <span>Endurance</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step-by-Step Guide */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-blue-200 dark:border-blue-700">
            <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              📋 Step-by-Step: What To Do Next
            </h4>
            
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Check Your Last Session
                  </h5>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Look at what you did last time. How many reps did you complete with good form?
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Choose Your Next Target
                  </h5>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Follow this progression:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1 ml-4">
                    <li><strong>If you did 8 reps:</strong> Try for 9-10 reps this session</li>
                    <li><strong>If you did 9-11 reps:</strong> Add 1 rep (aim for 10-12)</li>
                    <li><strong>If you did 12 reps easily:</strong> Add tempo (3-sec eccentric) or pause</li>
                    <li><strong>If you did 12+ with tempo:</strong> Add rest-pause or myo-reps technique</li>
                  </ul>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Execute With Focus
                  </h5>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Complete your target reps with perfect form. Stop 1-2 reps before failure (RIR 1-2).
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  4
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Log and Progress
                  </h5>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Log your actual reps. Next session, the app will suggest the next progression target.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Example Session Flow */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-blue-200 dark:border-blue-700">
            <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              💡 Example: Pull-ups Progression
            </h4>
            
              <div className="space-y-3 sm:hidden">
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Week 1</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">Target: <span className="font-medium text-green-700 dark:text-green-400">8 reps</span></div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Actual: 8 reps ✓</div>
                  <div className="text-sm text-blue-700 dark:text-blue-400">Next: Try 9 reps</div>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Week 2</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">Target: <span className="font-medium text-blue-700 dark:text-blue-400">9 reps</span></div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Actual: 9 reps ✓</div>
                  <div className="text-sm text-blue-700 dark:text-blue-400">Next: Try 10 reps</div>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Week 3</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">Target: <span className="font-medium text-blue-700 dark:text-blue-400">10 reps</span></div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Actual: 11 reps ✓</div>
                  <div className="text-sm text-purple-700 dark:text-purple-400">Next: Add 3-sec tempo</div>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Week 4</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">Target: <span className="font-medium text-purple-700 dark:text-purple-400">9 reps (tempo)</span></div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Actual: 10 reps ✓</div>
                  <div className="text-sm text-orange-700 dark:text-orange-400">Next: Add pause</div>
                </div>
              </div>

              <div className="hidden sm:block overflow-x-auto">
                <div className="space-y-3 min-w-[560px]">
                  <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-2">
                    <div>Week</div>
                    <div>Target</div>
                    <div>Actual</div>
                    <div>Next Step</div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="text-gray-700 dark:text-gray-300">Week 1</div>
                    <div className="font-medium text-green-700 dark:text-green-400">8 reps</div>
                    <div className="text-gray-600 dark:text-gray-400">8 reps ✓</div>
                    <div className="text-blue-700 dark:text-blue-400">→ Try 9 reps</div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="text-gray-700 dark:text-gray-300">Week 2</div>
                    <div className="font-medium text-blue-700 dark:text-blue-400">9 reps</div>
                    <div className="text-gray-600 dark:text-gray-400">9 reps ✓</div>
                    <div className="text-blue-700 dark:text-blue-400">→ Try 10 reps</div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="text-gray-700 dark:text-gray-300">Week 3</div>
                    <div className="font-medium text-blue-700 dark:text-blue-400">10 reps</div>
                    <div className="text-gray-600 dark:text-gray-400">11 reps ✓</div>
                    <div className="text-purple-700 dark:text-purple-400">→ Add 3-sec tempo</div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="text-gray-700 dark:text-gray-300">Week 4</div>
                    <div className="font-medium text-purple-700 dark:text-purple-400">9 reps (tempo)</div>
                    <div className="text-gray-600 dark:text-gray-400">10 reps ✓</div>
                    <div className="text-orange-700 dark:text-orange-400">→ Add pause</div>
                  </div>
                </div>
              </div>
          </div>

          {/* Key Principles */}
          <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700">
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              ⚠️ Important Principles
            </h4>
            <ul className="space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
              <li>• <strong>Form first:</strong> Perfect technique beats extra reps</li>
              <li>• <strong>Progressive overload:</strong> Always try to beat last session (reps, tempo, or technique)</li>
              <li>• <strong>Stay in 8-12 range:</strong> Optimal for muscle growth</li>
              <li>• <strong>RIR 1-2:</strong> Stop with 1-2 reps left in the tank</li>
              <li>• <strong>When capped on weight:</strong> Progress through reps → tempo → pause → techniques</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
