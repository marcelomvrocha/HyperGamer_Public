'use client';

import { useState, useEffect } from 'react';
import { apiPath } from '@/lib/app-paths';
import { getCalorieSuggestions } from '@/lib/calorie-suggestions';
import { getWeeklyQuestSummary, type WeeklyQuest, type BossBattle } from '@/lib/quests';

interface DecisionOutput {
  caloriesChange: number;
  addSetsPattern?: string;
  deload: boolean;
  reasoning: string[];
}

export default function WeeklyReview() {
  const [decision, setDecision] = useState<DecisionOutput | null>(null);
  const [weeklyQuests, setWeeklyQuests] = useState<WeeklyQuest[]>([]);
  const [bossBattles, setBossBattles] = useState<BossBattle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDecision();
  }, []);

  async function loadDecision() {
    try {
      const response = await fetch(apiPath('/api/decision'));
      const data = await response.json();
      setDecision(data);
      const workoutsRes = await fetch(apiPath('/api/workouts?limit=200'));
      const workouts = await workoutsRes.json();
      const questSummary = getWeeklyQuestSummary(workouts);
      setWeeklyQuests(questSummary.quests);
      setBossBattles(questSummary.bosses);
    } catch (error) {
      console.error('Error loading decision:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-900 dark:text-gray-100">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Weekly Review &amp; Analysis</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          This section now combines your weekly review and workout analysis insights.
        </p>
      </div>

      {decision && (
        <div className="space-y-6">
          {/* Boss Battles */}
          {bossBattles.length > 0 && (
            <div className="surface-card p-4 sm:p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-100 dark:text-gray-100">Boss Battles</h2>
	              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
	                {bossBattles.map(boss => (
                  <div
                    key={boss.id}
                    className={`border rounded-lg p-4 ${
                      boss.completed
                        ? 'border-green-500 bg-green-900/20'
                        : 'border-gray-600 bg-gray-700/60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                      <h3 className="font-semibold text-gray-100 dark:text-gray-100">{boss.title}</h3>
                      {boss.completed && <span className="text-xs font-semibold text-green-300">Cleared</span>}
                    </div>
                    <p className="text-sm text-gray-300 dark:text-gray-300 mb-3">{boss.description}</p>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${Math.min(100, Math.round((boss.progress / boss.goal) * 100))}%` }}
                      />
                    </div>
	                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-xs text-gray-400 mt-2">
	                      <span>Best: {boss.currentBest} reps</span>
	                      <span>Target: {boss.targetReps} reps</span>
	                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly Quests */}
          {weeklyQuests.length > 0 && (
            <div className="surface-card p-4 sm:p-6">
	              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
	                <h2 className="text-2xl font-bold text-gray-100 dark:text-gray-100">Weekly Quests</h2>
	                <span className="text-sm text-gray-400 dark:text-gray-400">
                  {weeklyQuests.filter(q => q.completed).length}/{weeklyQuests.length} completed
                </span>
              </div>
              <div className="space-y-3">
                {weeklyQuests.map(quest => (
                  <div
                    key={quest.id}
                    className={`border rounded-lg p-4 ${
                      quest.completed
                        ? 'border-green-500 bg-green-900/20'
                        : 'border-gray-600 bg-gray-700/60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                      <h3 className="font-semibold text-gray-100 dark:text-gray-100">{quest.title}</h3>
                      {quest.completed && <span className="text-xs font-semibold text-green-300">Complete</span>}
                    </div>
                    <p className="text-sm text-gray-300 dark:text-gray-300 mb-2">{quest.description}</p>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${Math.min(100, Math.round((quest.progress / quest.goal) * 100))}%` }}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-xs text-gray-400 mt-2">
                      <span>{quest.progress} / {quest.goal}</span>
                      {!quest.completed && <span>In progress</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main decision card */}
          <div className={`surface-card border-2 p-4 sm:p-6 ${
            decision.deload 
              ? 'border-yellow-500 dark:border-yellow-500' 
              : decision.caloriesChange > 0 
              ? 'border-green-500 dark:border-green-500'
              : 'border-blue-500 dark:border-blue-500'
          }`}>
            <h2 className="text-2xl font-bold mb-4 text-gray-100 dark:text-gray-100">This Week&apos;s Decision</h2>

            {decision.deload ? (
              <div className="space-y-3">
                <p className="text-lg font-semibold text-yellow-300 dark:text-yellow-300">🔄 Deload Week</p>
                <p className="text-gray-200 dark:text-gray-200">
                  Reduce sets by 40-50%. Keep technique crisp. This week is for recovery.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {decision.caloriesChange !== 0 && (
                  <div>
                    <p className="text-lg font-semibold text-gray-100 dark:text-gray-100 mb-3">
                      Calories: {decision.caloriesChange > 0 ? '+' : ''}{decision.caloriesChange} kcal/day
                    </p>
                    
                    {/* Practical suggestions */}
                    <div className="bg-gray-700 dark:bg-gray-700 rounded-lg p-4 mt-3">
                      <p className="text-sm font-medium text-gray-200 dark:text-gray-200 mb-2">
                        {decision.caloriesChange > 0 ? '📈 How to add calories:' : '📉 How to reduce calories:'}
                      </p>
                      <ul className="space-y-2 text-sm text-gray-300 dark:text-gray-300">
                        {getCalorieSuggestions(decision.caloriesChange).map((suggestion, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-gray-400 dark:text-gray-400">•</span>
                            <span>
                              <strong className="text-gray-200 dark:text-gray-200">
                                {suggestion.amount} {suggestion.food}
                              </strong>
                              {' '}({suggestion.calories > 0 ? '+' : ''}{suggestion.calories} kcal)
                              {suggestion.description && (
                                <span className="text-gray-400 dark:text-gray-400 block mt-1 ml-4">
                                  {suggestion.description}
                                </span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-gray-400 dark:text-gray-400 mt-3">
                        💡 Tip: Spread these additions throughout the day for better digestion and nutrient timing.
                      </p>
                    </div>
                  </div>
                )}
                {decision.addSetsPattern && (
                  <div>
                    <p className="text-lg font-semibold text-gray-100 dark:text-gray-100">
                      Add 2 sets/week to: <span className="capitalize">{decision.addSetsPattern}</span> pattern
                    </p>
                  </div>
                )}
                {decision.caloriesChange === 0 && !decision.addSetsPattern && (
                  <p className="text-lg font-semibold text-gray-100 dark:text-gray-100">✅ Maintain current programming</p>
                )}
              </div>
            )}

            {/* Reasoning */}
            <div className="mt-4 pt-4 border-t border-gray-600 dark:border-gray-600">
              <h3 className="font-semibold mb-2 text-gray-100 dark:text-gray-100">Reasoning:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-200 dark:text-gray-200">
                {decision.reasoning.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Guidelines */}
          <div className="surface-card p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-100 dark:text-gray-100">Decision Rules Reference</h3>
            <div className="space-y-3 text-sm text-gray-200 dark:text-gray-200">
              <div>
                <p className="font-medium text-gray-100 dark:text-gray-100">Rule 1 - Weight Trend:</p>
                <p className="text-gray-300 dark:text-gray-300">
                  If 7-day average weight isn&apos;t rising 0.15-0.30 kg/week for 2 weeks → Increase calories +150-200/day
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-100 dark:text-gray-100">Rule 2 - Performance KPIs:</p>
                <p className="text-gray-300 dark:text-gray-300">
                  Track your upper and lower sequence lifts week over week.
                  If fewer than half of the active lifts are improving → Add 2 sets/week to the lagging pattern.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-100 dark:text-gray-100">Rule 3 - Fatigue:</p>
                <p className="text-gray-300 dark:text-gray-300">
                  If performance down 2 sessions in a row on main lifts → Deload week (reduce sets 40-50%).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!decision && (
        <div className="surface-card p-4 sm:p-6">
          <p className="text-gray-200 dark:text-gray-200">
            Not enough data yet. Complete at least 2 weeks of workouts and biometrics to get recommendations.
          </p>
        </div>
      )}
    </div>
  );
}
