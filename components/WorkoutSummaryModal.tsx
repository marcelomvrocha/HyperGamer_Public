'use client';

import { useCallback, useEffect, useState } from 'react';
import { getAchievements, type Achievement } from '@/lib/achievements';
import { calculateNextTarget, type NextTarget } from '@/lib/progression';
import { EXERCISES, isPerHandExercise } from '@/lib/exercises';
import { apiPath } from '@/lib/app-paths';
import { useRouter } from 'next/navigation';
import { ProgressionStepLabel } from '@/components/ProgressionStepLabel';
import { normalizeTechnique, type WorkoutRecord, type WorkoutSetRecord } from '@/lib/workout-types';

interface WorkoutSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedExercises: Array<{
    id: string;
    name: string;
    sets: Array<{
      reps: number;
      loadLbs?: number | 'BW';
      rir?: number;
    }>;
  }>;
}

type CompletedExercise = WorkoutSummaryModalProps['completedExercises'][number];

function serializeWorkoutDate(dateValue: string | Date): string {
  return typeof dateValue === 'string' ? dateValue : dateValue.toISOString();
}

function matchesCompletedExercise(set: WorkoutSetRecord, exercise: CompletedExercise): boolean {
  const exerciseId = set.exercise?.id;
  const exerciseName = set.exercise?.name;
  return exerciseId === exercise.id || exerciseName === exercise.name;
}

export function WorkoutSummaryModal({ isOpen, onClose, completedExercises }: WorkoutSummaryModalProps) {
  const router = useRouter();
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [nextTargets, setNextTargets] = useState<NextTarget[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSummaryData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all workouts to calculate achievements
      const workoutsRes = await fetch(apiPath('/api/workouts?limit=500'));
      const workouts = (await workoutsRes.json()) as WorkoutRecord[];
      
      // Get all achievements
      const allAchievements = getAchievements(workouts);

      // Find newly unlocked achievements (earned today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newlyUnlocked = allAchievements.filter(achievement => {
        if (!achievement.earned || !achievement.earnedAt) return false;
        const earnedDate = new Date(achievement.earnedAt);
        earnedDate.setHours(0, 0, 0, 0);
        return earnedDate.getTime() === today.getTime();
      });
      setNewAchievements(newlyUnlocked);

      // Calculate next training day targets
      // Get last sessions for each exercise
      const lastSessions = completedExercises.map(ex => {
        const exerciseWorkouts = workouts
          .filter(workout =>
            workout.sets?.some(set => matchesCompletedExercise(set, ex))
          )
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const lastWorkout = exerciseWorkouts[0];
        const lastSets = lastWorkout?.sets
          ?.filter(set => matchesCompletedExercise(set, ex))
          .map(set => ({
            reps: set.reps,
            loadLbs: set.loadLbs ?? undefined,
            rir: set.rir ?? undefined,
            tempoEccSec: set.tempoEccSec ?? undefined,
            tempoPauseSec: set.tempoPauseSec ?? undefined,
            tempoConcSec: set.tempoConcSec ?? undefined,
            technique: normalizeTechnique(set.technique),
          })) || [];

        return {
          exerciseId: ex.id,
          date: lastWorkout?.date ? serializeWorkoutDate(lastWorkout.date) : undefined,
          sets: lastSets,
        };
      });

      // Calculate next targets for each completed exercise
      const targets = completedExercises.map(ex => {
        const lastSession = lastSessions.find(ls => ls.exerciseId === ex.id);
        return calculateNextTarget(ex.id, lastSession ? [lastSession] : []);
      });
      setNextTargets(targets);
    } catch (error) {
      console.error('Error loading summary data:', error);
    } finally {
      setLoading(false);
    }
  }, [completedExercises]);

  useEffect(() => {
    if (isOpen) {
      loadSummaryData();
    }
  }, [isOpen, loadSummaryData]);

  if (!isOpen) return null;

  const totalSets = completedExercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const totalReps = completedExercises.reduce((sum, ex) => 
    sum + ex.sets.reduce((setSum, set) => setSum + set.reps, 0), 0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[calc(100vh-1.5rem)] sm:max-h-[90vh] overflow-y-auto border border-gray-700 mt-2 sm:mt-0">
        {/* Header with celebration */}
        <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-5 sm:p-8 rounded-t-2xl">
          <div className="absolute inset-0 bg-black/20 rounded-t-2xl"></div>
          <div className="relative text-center">
            <div className="text-5xl sm:text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Workout Complete!</h2>
            <p className="text-blue-100 text-lg">Great job today, champion! 💪</p>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-400">Loading summary...</p>
            </div>
          ) : (
            <>
              {/* Workout Stats */}
              <div className="surface-card p-4 sm:p-6">
                <h3 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
                  <span>📊</span> Today&apos;s Stats
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400">{completedExercises.length}</div>
                    <div className="text-sm text-gray-400">Exercises</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400">{totalSets}</div>
                    <div className="text-sm text-gray-400">Sets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400">{totalReps}</div>
                    <div className="text-sm text-gray-400">Total Reps</div>
                  </div>
                </div>
              </div>

              {/* Completed Exercises */}
              <div className="surface-card p-4 sm:p-6">
                <h3 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
                  <span>✅</span> Exercises Completed
                </h3>
                <div className="space-y-3">
                  {completedExercises.map((exercise) => {
                    const isPerHand = isPerHandExercise(exercise.id);
                    return (
                      <div key={exercise.id} className="bg-gray-700/50 rounded-lg p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                          <span className="font-medium text-gray-200">{exercise.name}</span>
                          <span className="text-sm text-gray-400">{exercise.sets.length} sets</span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm">
                          {exercise.sets.map((set, idx) => (
                            <span key={idx} className="bg-gray-600/50 px-2 py-1 rounded text-gray-300">
                              {set.reps} reps
                              {set.loadLbs && set.loadLbs !== 'BW' 
                                ? ` @ ${set.loadLbs}${isPerHand ? ' lbs/hand' : ' lbs'}`
                                : set.loadLbs === 'BW' ? ' @ BW' : ''}
                              {set.rir !== undefined && set.rir !== null && ` (RIR ${set.rir})`}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* New Achievements */}
              {newAchievements.length > 0 && (
                <div className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 rounded-xl p-4 sm:p-6 border-2 border-yellow-500/50">
                  <h3 className="text-xl font-semibold text-yellow-300 mb-4 flex items-center gap-2">
                    <span>🏆</span> Achievements Unlocked!
                  </h3>
                  <div className="space-y-3">
                    {newAchievements.map((achievement) => (
                      <div key={achievement.id} className="bg-yellow-900/30 rounded-lg p-4 border border-yellow-500/30">
                        <div className="flex items-start gap-3">
                          <span className="text-3xl">{achievement.icon}</span>
                          <div className="flex-1">
                            <div className="font-semibold text-yellow-200 text-lg">{achievement.title}</div>
                            <div className="text-yellow-300/80 text-sm mt-1">{achievement.description}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Training Day Targets */}
              {nextTargets.length > 0 && (
                <div className="surface-card p-4 sm:p-6">
                  <h3 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
                    <span>🎯</span> Next Training Day Targets
                  </h3>
                  <div className="space-y-4">
                    {nextTargets.map((target) => {
                      const exercise = EXERCISES.find(e => e.id === target.exerciseId);
                      if (!exercise) return null;
                      const isPerHand = isPerHandExercise(target.exerciseId);
                      const isBodyweight = exercise.equipment === 'Bar' || exercise.equipment === 'Bodyweight';
                      
                      return (
                        <div key={target.exerciseId} className="bg-blue-900/30 rounded-lg p-4 border border-blue-500/30">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <div className="font-medium text-blue-200">{exercise.name}</div>
                            <ProgressionStepLabel sets={target.sets} />
                          </div>
                          {target.sets.length > 0 && (
                            <div className="text-sm text-blue-300/90 mb-2 italic">
                              {target.sets[0].instruction}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {target.sets.map((set, idx) => (
                              <span key={idx} className="bg-blue-800/50 px-2 py-1 rounded text-blue-200 text-sm">
                                Set {idx + 1}: {set.targetReps} reps
                                {set.targetLoadLbs !== undefined && set.targetLoadLbs !== null
                                  ? ` @ ${set.targetLoadLbs}${isPerHand ? ' lbs/hand' : ' lbs'}`
                                  : isBodyweight ? ' @ BW' : ''}
                                {set.targetRir !== undefined && ` (RIR ${set.targetRir})`}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Motivational Message */}
              <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 rounded-xl p-4 sm:p-6 border border-green-500/50 text-center">
                <p className="text-green-200 text-lg font-medium">
                  {newAchievements.length > 0 
                    ? `Amazing work! You've unlocked ${newAchievements.length} achievement${newAchievements.length > 1 ? 's' : ''} today! Keep pushing! 🔥`
                    : 'Consistency is key! Every workout brings you closer to your goals. Rest well and come back stronger! 💪'
                  }
                </p>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
            <button
              onClick={() => {
                onClose();
                router.push('/');
              }}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
            >
              Back to Home
            </button>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 bg-gray-700 text-gray-200 rounded-lg font-medium hover:bg-gray-600 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
