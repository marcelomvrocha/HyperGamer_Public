'use client';

import { memo, useState, useEffect, useCallback, useRef } from 'react';
import {
  EXERCISES,
  findExerciseById,
  getSequenceDefinition,
  getSequenceExercises,
  isBodyweightExercise,
  isPerHandExercise,
  WORKOUT_SEQUENCES,
  normalizeExerciseName,
  type WorkoutSequenceId,
} from '@/lib/exercises';
import { apiPath } from '@/lib/app-paths';
import { calculateNextTarget, getWorkoutTargets, type LastSession } from '@/lib/progression';
import { HypertrophyGuide } from './HypertrophyGuide';
import { FieldTooltip } from './FieldTooltip';
import { findExerciseDemo, getYouTubeEmbedUrl } from '@/lib/exercise-demos';
import { calculateXpSummary, type XpSummary } from '@/lib/xp';
import { useRouter } from 'next/navigation';
import { useAchievementToasts } from '@/components/useAchievementToasts';
import { WorkoutSummaryModal } from './WorkoutSummaryModal';
import { ProgressionStepLabel } from './ProgressionStepLabel';
import { getLatestLoggedSequence } from '@/lib/performance-metrics';
import {
  normalizeTechnique,
  type DatabaseExerciseRecord,
  type LoggedTechnique,
  type WorkoutRecord,
  type WorkoutSetRecord,
} from '@/lib/workout-types';

interface SetEntry {
  reps: number;
  loadLbs?: number | 'BW';
  rir?: number;
  targetRir?: number;
  tempoEccSec?: number;
  tempoPauseSec?: number;
  tempoConcSec?: number;
  technique: 'none' | 'restpause' | 'myoreps' | 'partials';
  notes?: string;
}

interface ExerciseData {
  id: string;
  name: string;
  equipment: string;
  lastSession?: {
    date?: string;
    sets: Array<{
      reps: number;
      loadLbs?: number;
      notes?: string;
      rir?: number;
      tempoEccSec?: number;
      tempoPauseSec?: number;
      technique?: LoggedTechnique;
    }>;
  };
  nextTarget?: {
    sets: Array<{
      targetReps: number;
      targetLoadLbs?: number;
      tempoEccSec?: number;
      tempoPauseSec?: number;
      tempoConcSec?: number;
      technique?: 'none' | 'restpause' | 'myoreps' | 'partials';
      targetRir?: number;
      instruction: string;
    }>;
  };
  sets: SetEntry[];
  videoUrl?: string;
}

type SetEntryField = keyof SetEntry;
type SetEntryValue = SetEntry[SetEntryField] | undefined;
type WorkoutWithNormalizedDate = WorkoutRecord & { normalizedDate: string };

interface ExerciseFeedbackData {
  message: string;
  nextSteps: string;
}

interface ExerciseSectionProps {
  exercise: ExerciseData;
  exIdx: number;
  saving: boolean;
  isSaved: boolean;
  feedback?: ExerciseFeedbackData;
  todayStr: string;
  yesterdayStr: string;
  onUpdateSet: (exerciseIndex: number, setIndex: number, field: SetEntryField, value: SetEntryValue) => void;
  onAddSet: (exerciseIndex: number) => void;
  onRemoveSet: (exerciseIndex: number, setIndex: number) => void;
  onSaveExercise: (exerciseIndex: number) => void;
}

// Helper to normalize dates to just the date (no time) for comparison
// Uses local time to match how today's date is calculated
const normalizeDate = (dateStr: string | Date): string => {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  // Normalize to local date (not UTC) to match todayStr calculation
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const serializeWorkoutDate = (dateValue?: string | Date): string | undefined => {
  if (!dateValue) {
    return undefined;
  }

  return typeof dateValue === 'string' ? dateValue : dateValue.toISOString();
};

const normalizeExerciseKey = (name?: string | null): string => {
  return name ? normalizeExerciseName(name) : '';
};

function getOppositeSequence(sequence: WorkoutSequenceId): WorkoutSequenceId {
  return sequence === 'upper' ? 'lower' : 'upper';
}

const ExerciseSection = memo(function ExerciseSection({
  exercise,
  exIdx,
  saving,
  isSaved,
  feedback,
  todayStr,
  yesterdayStr,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
  onSaveExercise,
}: ExerciseSectionProps) {
  const isSplitSquat = exercise.id === 'split-squat';
  const isRDL = exercise.id === 'rdl';
  const isStandingCalfRaise = exercise.id === 'standing-calf-raise';
  const isPerHand = isPerHandExercise(exercise.id);
  const lastDate = exercise.lastSession?.date ? normalizeDate(exercise.lastSession.date) : null;
  const isToday = lastDate === todayStr;
  const isYesterday = lastDate === yesterdayStr;

  return (
    <div
      id={`exercise-${exercise.id}`}
      className="surface-card w-full max-w-full p-4 sm:p-6 pb-6 sm:pb-8 overflow-y-visible overflow-x-hidden"
    >
      {/* Exercise Name with Embedded Video */}
      <div className="mb-4 grid gap-4 justify-items-center">
        <div className="min-w-0 w-full text-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {exercise.name}
          </h3>
        </div>
        {exercise.videoUrl ? (
          <div className="w-full flex justify-center">
            <div className="w-full max-w-3xl">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <iframe
                  src={getYouTubeEmbedUrl(exercise.videoUrl)}
                  title={`${exercise.name} demonstration`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                  loading="lazy"
                  frameBorder="0"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-full max-w-3xl aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Video coming soon</p>
            </div>
          </div>
        )}
      </div>

      {/* Last session summary */}
      {exercise.lastSession && (
        <div className={`mb-4 p-3 rounded ${
          isToday
            ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700'
            : 'bg-gray-50 dark:bg-gray-700'
        }`}>
          <p className={`text-sm font-medium mb-2 ${
            isToday
              ? 'text-green-900 dark:text-green-100'
              : 'text-gray-900 dark:text-gray-100'
          }`}>
            {isToday ? '✅ Today' : isYesterday ? '📅 Yesterday' : 'Last time'}
            {exercise.lastSession.date ? ` (${lastDate})` : ''}:
          </p>
          <div className="text-sm text-gray-800 dark:text-gray-200">
            {exercise.lastSession.sets.map((set, i) => (
              <div key={i}>
                Set {i + 1}: {set.reps} reps
                {set.loadLbs ? ` @ ${set.loadLbs}${isPerHand ? ' lbs/hand' : ' lbs'}` : set.notes === 'BW' ? ' @ BW' : ''}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next target */}
      {exercise.nextTarget && exercise.nextTarget.sets.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Next target ({exercise.nextTarget.sets.length} sets):
            </p>
            <ProgressionStepLabel sets={exercise.nextTarget.sets} />
          </div>
          {exercise.nextTarget.sets[0]?.instruction && (
            <div className="text-xs text-blue-700 dark:text-blue-300 mb-3 italic">
              {exercise.nextTarget.sets[0].instruction}
            </div>
          )}
          <div className="text-sm text-blue-800 dark:text-blue-200">
            {exercise.nextTarget.sets.map((target, i) => (
              <div key={i} className="mb-1">
                <div className="font-medium">
                  Set {i + 1}: Aim for {target.targetReps} reps
                  {target.targetLoadLbs !== undefined && target.targetLoadLbs !== null ? ` @ ${target.targetLoadLbs}${isPerHand ? ' lbs/hand' : ' lbs'}` : ''}
                  {target.targetRir !== undefined ? ` • Target RIR ${target.targetRir}` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logging Form */}
      <div className="mt-4 space-y-3 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Log your sets:</p>
        {exercise.sets.map((set, setIdx) => (
          <div key={setIdx} className="glass-panel p-3 sm:p-4 space-y-2 min-w-0">
            <div className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-3">Set {setIdx + 1}</div>
            
            <div className="grid grid-cols-1 gap-3 min-w-0 sm:grid-cols-2 xl:grid-cols-5 xl:items-end">
              <FieldTooltip
                label="Reps (Repetitions)"
                explanation="The number of complete movements you did in this set. For building muscle, 8–12 reps per set is a good target; 6–20 can work. Count only full, controlled reps."
              >
                <div className="flex w-full flex-col">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Reps</label>
                  <input
                    type="number"
                    placeholder="8"
                    value={set.reps || ''}
                    onChange={(e) => onUpdateSet(exIdx, setIdx, 'reps', parseInt(e.target.value) || 0)}
                    className="glass-input w-full sm:w-28 px-4 py-2.5 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </FieldTooltip>

              <FieldTooltip
                label="Load (Weight)"
                explanation={isSplitSquat
                  ? "The weight per hand (each dumbbell). For split squats, enter the weight of one dumbbell."
                  : isRDL
                  ? "The weight per hand (each dumbbell). For RDL, you can carry one dumbbell in each hand. Enter the weight of one dumbbell."
                  : isStandingCalfRaise
                  ? "The weight per hand (each dumbbell). For standing calf raises, enter the weight of one dumbbell."
                  : "The weight used for the exercise. Select 'Bodyweight (BW)' for pull-ups, push-ups, etc., or 'Weight (lbs)' and enter the dumbbell/barbell weight."}
              >
                <div className="flex w-full flex-col">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {isPerHand ? 'Load (lbs/hand)' : 'Load'}
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <select
                      value={set.loadLbs === 'BW' ? 'BW' : typeof set.loadLbs === 'number' ? 'weight' : ''}
                      onChange={(e) => {
                        if (e.target.value === 'BW') {
                          onUpdateSet(exIdx, setIdx, 'loadLbs', 'BW');
                        } else if (e.target.value === 'weight') {
                          const currentVal = typeof set.loadLbs === 'number' ? set.loadLbs : 0;
                          onUpdateSet(exIdx, setIdx, 'loadLbs', currentVal);
                        } else {
                          onUpdateSet(exIdx, setIdx, 'loadLbs', undefined);
                        }
                      }}
                      className="glass-input w-full sm:w-auto px-4 py-2.5 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                    >
                      <option value="" className="bg-white dark:bg-gray-800">Select</option>
                      <option value="BW" className="bg-white dark:bg-gray-800">Bodyweight (BW)</option>
                      <option value="weight" className="bg-white dark:bg-gray-800">Weight (lbs)</option>
                    </select>
                    {(() => {
                      const loadType = set.loadLbs === 'BW' ? 'BW' : typeof set.loadLbs === 'number' ? 'weight' : '';
                      
                      if (loadType === 'BW') {
                        return <span className="text-xs text-gray-600 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">BW</span>;
                      } else if (loadType === 'weight') {
                        return (
                          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                            <input
                              type="number"
                              placeholder={isPerHand ? "20" : "40"}
                              value={typeof set.loadLbs === 'number' && set.loadLbs > 0 ? set.loadLbs : ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                onUpdateSet(exIdx, setIdx, 'loadLbs', isNaN(val) || val < 0 ? 0 : val);
                              }}
                              className="glass-input w-full sm:w-28 px-4 py-2.5 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              min="0"
                              step="0.5"
                            />
                            {isPerHand && (
                              <span className="text-xs text-gray-600 dark:text-gray-400">/hand</span>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </FieldTooltip>

              <FieldTooltip
                label="RIR (Reps in Reserve)"
                explanation="How many more reps you feel you could have done after stopping. 0 = you could not do one more rep (failure). 1–2 = you could have done 1–2 more (near failure—best for building muscle). 3+ = you stopped with more in the tank. Aim for 1–2 RIR on most working sets."
              >
                <div className="flex w-full flex-col">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">RIR</label>
                  <input
                    type="number"
                    placeholder="0-2"
                    value={set.rir !== undefined && set.rir !== null ? set.rir : ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? undefined : parseInt(e.target.value);
                      onUpdateSet(exIdx, setIdx, 'rir', val !== undefined && !isNaN(val) && val >= 0 ? val : undefined);
                    }}
                    className="glass-input w-full sm:w-24 px-4 py-2.5 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    max="5"
                  />
                </div>
              </FieldTooltip>

              <FieldTooltip
                label="Tempo (Time Under Tension)"
                explanation="Controls how long each rep takes. Three numbers: Eccentric (lowering, e.g. 2–3 sec)—Pause (hold at bottom/stretch, 0–2 sec)—Concentric (lifting, usually 1 sec). Example 3-1-1: 3 sec down, 1 sec pause at bottom, 1 sec up. Slower eccentrics increase muscle tension; a short pause removes momentum. Leave blank or use 2-0-1 if you're not focusing on tempo yet."
              >
                <div className="flex w-full flex-col">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tempo</label>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <input
                      type="number"
                      placeholder="Ecc"
                      value={set.tempoEccSec || ''}
                      onChange={(e) => onUpdateSet(exIdx, setIdx, 'tempoEccSec', parseInt(e.target.value) || undefined)}
                      className="glass-input w-full px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      title="Eccentric (lowering phase) in seconds"
                    />
                    <input
                      type="number"
                      placeholder="Pause"
                      value={set.tempoPauseSec || ''}
                      onChange={(e) => onUpdateSet(exIdx, setIdx, 'tempoPauseSec', parseInt(e.target.value) || undefined)}
                      className="glass-input w-full px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      title="Pause at stretch/bottom in seconds"
                    />
                    <input
                      type="number"
                      placeholder="Conc"
                      value={set.tempoConcSec || ''}
                      onChange={(e) => onUpdateSet(exIdx, setIdx, 'tempoConcSec', parseInt(e.target.value) || undefined)}
                      className="glass-input w-full px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      title="Concentric (lifting phase) in seconds"
                    />
                  </div>
                </div>
              </FieldTooltip>

              <FieldTooltip
                label="Intensity Technique"
                explanation="Use these when you can't add more weight or reps. None = standard set. Rest-Pause: Do a set to near-failure, rest 10–15 sec (breathe, keep the weight), then do 2–4 more reps; repeat once if you can. Myo-Reps: Like rest-pause—after your main set, rest 10–15 sec, do 2–3 reps, rest again, then 1–2 reps. Partials: When you can't do another full rep, do 3–5 short partial reps (e.g. top half of the movement) to extend the set. Start with 'None' until you're comfortable with tempo and RIR."
              >
                <div className="flex w-full flex-col">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Technique</label>
                      <select
                        value={set.technique}
                        onChange={(e) => onUpdateSet(exIdx, setIdx, 'technique', normalizeTechnique(e.target.value) ?? 'none')}
                        className="glass-input w-full px-4 py-2.5 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                      >
                    <option value="none" className="bg-white dark:bg-gray-800">None</option>
                    <option value="restpause" className="bg-white dark:bg-gray-800">Rest-Pause</option>
                    <option value="myoreps" className="bg-white dark:bg-gray-800">Myo-Reps</option>
                    <option value="partials" className="bg-white dark:bg-gray-800">Partials</option>
                  </select>
                </div>
              </FieldTooltip>

              {exercise.sets.length > 1 && (
                <div className="flex w-full items-end xl:w-auto">
                  <button
                    type="button"
                    onClick={() => onRemoveSet(exIdx, setIdx)}
                    className="w-full xl:w-auto px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => onAddSet(exIdx)}
          className="w-full sm:w-auto text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-left"
        >
          + Add Set
        </button>
      </div>

      <div className="mt-4 pt-2 pb-2 min-h-[48px] w-full flex items-center">
        <button
          type="button"
          onClick={() => onSaveExercise(exIdx)}
          disabled={saving || isSaved}
          className="w-full min-h-[44px] px-4 py-3 bg-green-600 text-white rounded-lg font-medium text-center leading-tight whitespace-normal break-words hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          {saving ? 'Saving...' : isSaved ? '✓ Exercise Saved' : 'Save Exercise'}
        </button>
      </div>

      {feedback && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded">
          <p className="text-sm font-medium text-green-900 dark:text-green-200 mb-2">📊 How It Went:</p>
          <p className="text-sm text-green-800 dark:text-green-300 mb-2">
            {feedback.message}
          </p>
          <p className="text-xs text-green-700 dark:text-green-400">
            <strong>Next Steps:</strong> {feedback.nextSteps}
          </p>
        </div>
      )}
    </div>
  );
}, (prev, next) => {
  return (
    prev.exercise === next.exercise &&
    prev.saving === next.saving &&
    prev.isSaved === next.isSaved &&
    prev.feedback?.message === next.feedback?.message &&
    prev.feedback?.nextSteps === next.feedback?.nextSteps &&
    prev.todayStr === next.todayStr &&
    prev.yesterdayStr === next.yesterdayStr
  );
});

export function TodayWorkout() {
  const router = useRouter();
  const { ensureAchievementBaseline, checkForNewAchievements } = useAchievementToasts();
  const [selectedSequence, setSelectedSequence] = useState<WorkoutSequenceId | null>(null);
  const [suggestedSequence, setSuggestedSequence] = useState<WorkoutSequenceId>('upper');
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingExerciseId, setSavingExerciseId] = useState<string | null>(null);
  const [savedExercises, setSavedExercises] = useState<Set<string>>(new Set());
  const [exerciseFeedback, setExerciseFeedback] = useState<Map<string, { message: string; nextSteps: string }>>(new Map());
  const [xpSummary, setXpSummary] = useState<XpSummary | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const pendingScrollRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);
  const hasSyncedExercisesRef = useRef(false);
  const exerciseDbIdByNameRef = useRef<Map<string, string>>(new Map());

  // Helper function to match exercise names (case-insensitive, trimmed)
  const matchExerciseName = (name1: string, name2: string): boolean => {
    return name1?.trim().toLowerCase() === name2?.trim().toLowerCase();
  };

  const loadWorkoutData = useCallback(async () => {
    if (!hasLoadedRef.current) {
      setLoading(true);
    }
    try {
      // Fetch all workouts so XP/level matches the Progress tab calculation.
      const workoutsRes = await fetch(apiPath('/api/workouts?all=true&view=compact'));
      if (!workoutsRes.ok) {
        throw new Error(`Failed to fetch workouts: ${workoutsRes.statusText}`);
      }
      const workouts = (await workoutsRes.json()) as WorkoutRecord[];
      
      console.log(`Loaded ${workouts.length} workouts`);
      setXpSummary(calculateXpSummary(workouts));

      const latestLoggedSequence = getLatestLoggedSequence(workouts);
      const recommendedSequence = latestLoggedSequence
        ? getOppositeSequence(latestLoggedSequence)
        : 'upper';
      setSuggestedSequence(recommendedSequence);

      const activeSequence = selectedSequence ?? recommendedSequence;
      if (!selectedSequence) {
        setSelectedSequence(activeSequence);
      }

      // Ensure exercise definitions are synced into the DB only once per mount.
      if (!hasSyncedExercisesRef.current) {
        const exercisesRes = await fetch(apiPath('/api/exercises'));
        if (exercisesRes.ok) {
          const dbExercises = (await exercisesRes.json()) as DatabaseExerciseRecord[];
          const idMap = new Map<string, string>();
          for (const dbEx of dbExercises) {
            const key = normalizeExerciseKey(dbEx.name);
            if (key && dbEx.id) {
              idMap.set(key, dbEx.id);
            }
          }
          exerciseDbIdByNameRef.current = idMap;
        }
        hasSyncedExercisesRef.current = true;
      }

      // Get today's date string for comparison (using local date, not UTC)
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const workoutsByDate: WorkoutWithNormalizedDate[] = workouts
        .map((workout) => ({
          ...workout,
          normalizedDate: normalizeDate(workout.date),
        }))
        .sort((a, b) => {
          // Sort by date descending, while prioritizing today's workouts.
          if (a.normalizedDate === todayStr && b.normalizedDate !== todayStr) return -1;
          if (b.normalizedDate === todayStr && a.normalizedDate !== todayStr) return 1;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

      const workoutsByExerciseName = new Map<string, WorkoutWithNormalizedDate[]>();
      for (const workout of workoutsByDate) {
        const seenInWorkout = new Set<string>();
        for (const set of workout.sets ?? []) {
          const exerciseKey = normalizeExerciseKey(set.exercise?.name);
          if (!exerciseKey || seenInWorkout.has(exerciseKey)) continue;
          seenInWorkout.add(exerciseKey);
          const bucket = workoutsByExerciseName.get(exerciseKey);
          if (bucket) {
            bucket.push(workout);
          } else {
            workoutsByExerciseName.set(exerciseKey, [workout]);
          }
        }
      }

      // Build last sessions data for every exercise so progression survives sequence switches.
      const lastSessions: LastSession[] = [];
      const savedTodayExerciseIds = new Set<string>();
      
      // Process all workouts to find most recent session for each exercise
      for (const exercise of EXERCISES) {
        const workoutsWithExercise =
          workoutsByExerciseName.get(normalizeExerciseKey(exercise.name)) ?? [];

        if (workoutsWithExercise.some(workout => workout.normalizedDate === todayStr)) {
          savedTodayExerciseIds.add(exercise.id);
        }
        
        if (workoutsWithExercise.length > 0) {
          const mostRecent = workoutsWithExercise[0];
          const exerciseSets = (mostRecent.sets ?? []).filter(
            (set) => matchExerciseName(set.exercise?.name || '', exercise.name)
          );
          
          if (exerciseSets.length > 0) {
            lastSessions.push({
              exerciseId: exercise.id,
              date: serializeWorkoutDate(mostRecent.date),
              sets: exerciseSets.map((set) => ({
                reps: set.reps,
                loadLbs: set.loadLbs ?? undefined,
                rir: set.rir ?? undefined,
                tempoEccSec: set.tempoEccSec ?? undefined,
                tempoPauseSec: set.tempoPauseSec ?? undefined,
                tempoConcSec: set.tempoConcSec ?? undefined,
                technique: normalizeTechnique(set.technique),
              })),
            });
          }
        }
      }

      // Persist "saved" state by deriving it from today's logged workouts.
      setSavedExercises(savedTodayExerciseIds);

      const targets = getWorkoutTargets(activeSequence, lastSessions);
      const targetsByExerciseId = new Map(targets.map(target => [target.exerciseId, target]));
      const sequenceExercises = getSequenceExercises(activeSequence);

      const exerciseList: ExerciseData[] = sequenceExercises.map(ex => {
        const workoutsWithExercise =
          workoutsByExerciseName.get(normalizeExerciseKey(ex.name)) ?? [];
        
        // Get the most recent workout (prioritizing today)
        const lastWorkoutForExercise = workoutsWithExercise[0];
        
        // Collect ALL sets from today's workouts for this exercise, then fall back to most recent
        let lastExerciseSets: WorkoutSetRecord[] = [];
        let lastWorkoutDate: string | undefined;
        
        // First, try to get sets from today's workouts
        const todayWorkouts = workoutsWithExercise.filter(workout => workout.normalizedDate === todayStr);
        if (todayWorkouts.length > 0) {
          // Collect all sets from all today's workouts for this exercise
          todayWorkouts.forEach((workout) => {
            const setsFromWorkout = workout.sets?.filter(
              (set) => matchExerciseName(set.exercise?.name || '', ex.name)
            ) || [];
            lastExerciseSets = [...lastExerciseSets, ...setsFromWorkout];
          });
          // Use the date from the first today's workout
          if (todayWorkouts[0]) {
            lastWorkoutDate = serializeWorkoutDate(todayWorkouts[0].date);
          }
        }
        
        // If no sets from today, use the most recent workout
        if (lastExerciseSets.length === 0 && lastWorkoutForExercise) {
          lastExerciseSets = lastWorkoutForExercise.sets?.filter(
            (set) => matchExerciseName(set.exercise?.name || '', ex.name)
          ) || [];
          lastWorkoutDate = serializeWorkoutDate(lastWorkoutForExercise.date);
        }

        const target = targetsByExerciseId.get(ex.id);
        
        // Pre-populate sets from nextTarget
        const isBodyweight = isBodyweightExercise(ex);
        const lastSessionWeight = lastExerciseSets.length > 0 
          ? (lastExerciseSets[0]?.loadLbs !== null && lastExerciseSets[0]?.loadLbs !== undefined 
              ? lastExerciseSets[0].loadLbs 
              : null)
          : null;
        
        const initialSets: SetEntry[] = target && target.sets.length > 0
          ? target.sets.map(t => {
              let loadLbs: number | 'BW' | undefined;
              if (isBodyweight) {
                loadLbs = 'BW';
              } else if (t.targetLoadLbs !== undefined && t.targetLoadLbs !== null) {
                loadLbs = t.targetLoadLbs;
              } else if (lastSessionWeight !== null && lastSessionWeight !== undefined) {
                loadLbs = lastSessionWeight;
              } else {
                loadLbs = undefined;
              }
              
              return {
                reps: t.targetReps,
                loadLbs,
                targetRir: t.targetRir,
                rir: undefined,
                tempoEccSec: t.tempoEccSec,
                tempoPauseSec: t.tempoPauseSec,
                tempoConcSec: t.tempoConcSec || 1,
                technique: t.technique || 'none',
              };
            })
          : [{ 
              reps: ex.defaultRepRangeMin, 
              loadLbs: isBodyweight 
                ? 'BW' as const 
                : (lastSessionWeight !== null && lastSessionWeight !== undefined 
                    ? lastSessionWeight 
                    : undefined), 
              targetRir: 2,
              technique: 'none' as const 
            }];

        const demo = findExerciseDemo(ex.name);

        // Always include lastSession if we have data
        const lastSession = lastExerciseSets.length > 0 && lastWorkoutDate
          ? {
              date: lastWorkoutDate,
              sets: lastExerciseSets.map((set) => ({
                reps: set.reps,
                loadLbs: set.loadLbs ?? undefined,
                notes: set.notes ?? undefined,
                rir: set.rir ?? undefined,
                tempoEccSec: set.tempoEccSec ?? undefined,
                tempoPauseSec: set.tempoPauseSec ?? undefined,
                tempoConcSec: set.tempoConcSec ?? undefined,
                technique: normalizeTechnique(set.technique),
              })),
            }
          : undefined;

        return {
          id: ex.id,
          name: ex.name,
          equipment: ex.equipment,
          sets: initialSets,
          lastSession,
          nextTarget: target
            ? {
                sets: target.sets.map(s => ({
                  targetReps: s.targetReps,
                  targetLoadLbs: s.targetLoadLbs,
                  targetRir: s.targetRir,
                  tempoEccSec: s.tempoEccSec,
                  tempoPauseSec: s.tempoPauseSec,
                  tempoConcSec: s.tempoConcSec,
                  technique: s.technique,
                  instruction: s.instruction,
                })),
              }
            : undefined,
          videoUrl: demo?.videoUrl,
        };
      });

      setExercises(exerciseList);

      if (pendingScrollRef.current) {
        const targetId = pendingScrollRef.current;
        pendingScrollRef.current = null;
        requestAnimationFrame(() => {
          const element = document.getElementById(`exercise-${targetId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      }
    } catch (error) {
      console.error('Error loading workout data:', error);
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
    }
  }, [selectedSequence]);

  useEffect(() => {
    loadWorkoutData();
  }, [loadWorkoutData]);

  useEffect(() => {
    void ensureAchievementBaseline();
  }, [ensureAchievementBaseline]);

  const updateSet = useCallback((exerciseIndex: number, setIndex: number, field: SetEntryField, value: SetEntryValue) => {
    setExercises(prev =>
      prev.map((exercise, idx) =>
        idx !== exerciseIndex
          ? exercise
          : {
              ...exercise,
              sets: exercise.sets.map((set, currentSetIndex) =>
                currentSetIndex !== setIndex ? set : ({ ...set, [field]: value } as SetEntry)
              ),
            }
      )
    );
  }, []);

  const addSet = useCallback((exerciseIndex: number) => {
    setExercises(prev =>
      prev.map((exercise, idx) => {
        if (idx !== exerciseIndex) return exercise;
        const lastSet = exercise.sets[exercise.sets.length - 1];
        return {
          ...exercise,
          sets: [
            ...exercise.sets,
            {
              reps: lastSet.reps,
              loadLbs: lastSet.loadLbs,
              technique: lastSet.technique,
              targetRir: lastSet.targetRir,
              rir: lastSet.rir,
              tempoEccSec: lastSet.tempoEccSec,
              tempoPauseSec: lastSet.tempoPauseSec,
              tempoConcSec: lastSet.tempoConcSec,
            },
          ],
        };
      })
    );
  }, []);

  const removeSet = useCallback((exerciseIndex: number, setIndex: number) => {
    setExercises(prev =>
      prev.map((exercise, idx) =>
        idx !== exerciseIndex
          ? exercise
          : {
              ...exercise,
              sets: exercise.sets.filter((_, currentSetIndex) => currentSetIndex !== setIndex),
            }
      )
    );
  }, []);

  async function saveExercise(exerciseIndex: number) {
    const exercise = exercises[exerciseIndex];
    if (!exercise || exercise.sets.length === 0) {
      alert('Please add at least one set before saving.');
      return;
    }
    
    // Validate that all sets have reps
    const invalidSets = exercise.sets.filter(s => !s.reps || s.reps <= 0);
    if (invalidSets.length > 0) {
      alert(`Please enter valid reps for all sets. Set ${invalidSets.length > 1 ? 's' : ''} ${invalidSets.map((_, i) => exercise.sets.indexOf(invalidSets[i]) + 1).join(', ')} ${invalidSets.length > 1 ? 'are' : 'is'} missing reps.`);
      return;
    }
    
    if (savedExercises.has(exercise.id)) {
      alert('This exercise was already saved today. Edit another exercise or end workout.');
      return;
    }

    setSavingExerciseId(exercise.id);
    try {
      await ensureAchievementBaseline();

      const exerciseDef = findExerciseById(exercise.id);
      if (!exerciseDef) {
        throw new Error(`Exercise definition not found for ${exercise.id}`);
      }

      let dbExerciseId = exerciseDbIdByNameRef.current.get(normalizeExerciseKey(exerciseDef.name));

      if (!dbExerciseId) {
        const exercisesResponse = await fetch(apiPath('/api/exercises'));
        if (exercisesResponse.ok) {
          const dbExercises = (await exercisesResponse.json()) as DatabaseExerciseRecord[];
          const idMap = new Map<string, string>();
          for (const dbEx of dbExercises) {
            const key = normalizeExerciseKey(dbEx.name);
            if (key && dbEx.id) {
              idMap.set(key, dbEx.id);
            }
          }
          exerciseDbIdByNameRef.current = idMap;
          dbExerciseId = idMap.get(normalizeExerciseKey(exerciseDef.name));
        }
      }

      if (!dbExerciseId) {
        throw new Error(`Database exercise not found for ${exerciseDef.name}`);
      }
      
      // Validate and prepare sets
      const sets = exercise.sets.map((set, setIdx) => {
        if (!set.reps || set.reps <= 0) {
          throw new Error(`Set ${setIdx + 1} is missing valid reps`);
        }
        return {
          exerciseId: dbExerciseId,
          reps: set.reps,
          loadLbs: set.loadLbs === 'BW' ? null : (typeof set.loadLbs === 'number' ? set.loadLbs : null),
          rir: set.rir !== undefined && set.rir !== null ? set.rir : null,
          tempoEccSec: set.tempoEccSec || null,
          tempoPauseSec: set.tempoPauseSec || null,
          tempoConcSec: set.tempoConcSec || 1,
          technique: set.technique || 'none',
          notes: set.loadLbs === 'BW' ? 'BW' : (set.notes || null),
        };
      });

      const activeSequence = selectedSequence ?? 'upper';

      // Explicitly set today's date in local timezone
      const today = new Date();
      const todayDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      console.log(`Saving exercise ${exercise.name} with ${sets.length} sets for date ${todayDateStr}`);

      const response = await fetch(apiPath('/api/workouts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: todayDateStr, // Explicitly pass today's date
          sequence: activeSequence,
          sets,
        }),
      });

      if (response.ok) {
        const savedWorkout = (await response.json()) as WorkoutRecord;
        console.log(`Successfully saved workout:`, savedWorkout);
        
        setSavedExercises(prev => new Set(prev).add(exercise.id));
        
        // Generate feedback aligned with progression
        const avgReps = exercise.sets.reduce((sum, s) => sum + s.reps, 0) / exercise.sets.length;
        const plannedTarget = exercise.nextTarget?.sets[0];
        const targetReps = plannedTarget?.targetReps ?? avgReps;
        const targetWeight = plannedTarget?.targetLoadLbs;
        const actualWeight = typeof exercise.sets[0]?.loadLbs === 'number' ? exercise.sets[0].loadLbs : null;
        const isPerHand = isPerHandExercise(exercise.id);
        const weightSuffix = isPerHand ? ' lbs/hand' : ' lbs';
        const totalVolume = exercise.sets.reduce((sum, s) => {
          const weight = typeof s.loadLbs === 'number' ? s.loadLbs : 0;
          return sum + (s.reps * weight);
        }, 0);

        const completedSession: LastSession = {
          exerciseId: exercise.id,
          date: todayDateStr,
          sets: exercise.sets.map(set => ({
            reps: set.reps,
            loadLbs: typeof set.loadLbs === 'number' ? set.loadLbs : undefined,
            rir: set.rir,
            tempoEccSec: set.tempoEccSec,
            tempoPauseSec: set.tempoPauseSec,
            tempoConcSec: set.tempoConcSec,
            technique: set.technique,
          })),
        };
        const nextTargetNow = calculateNextTarget(exercise.id, [completedSession]);
        const nextInstruction = nextTargetNow.sets[0]?.instruction;

        let message = '';
        let nextSteps = '';

        if (actualWeight && targetWeight && actualWeight < targetWeight) {
          const actualLabel = `${actualWeight}${weightSuffix}`;
          const targetLabel = `${targetWeight}${weightSuffix}`;
          message = `Great workout today! You used ${actualLabel} (down from ${targetLabel}), but completed solid sets with good volume (${totalVolume} lbs total).`;
          nextSteps = nextInstruction
            ? `Next target: ${nextInstruction}`
            : `Next time, aim for ${targetLabel} with the same reps, or maintain ${actualLabel} and add 1-2 reps per set.`;
        } else if (avgReps >= targetReps) {
          message = `Excellent! You hit or exceeded your target of ${targetReps} reps. Total volume: ${totalVolume} lbs.`;
          nextSteps = nextInstruction
            ? `Next target: ${nextInstruction}`
            : `Next time, maintain the same weight and aim for ${targetReps + 1} reps, or add 1-2 more reps across all sets.`;
        } else if (avgReps >= targetReps * 0.9) {
          message = `Good work! You're close to your target of ${targetReps} reps (averaged ${avgReps.toFixed(1)}).`;
          nextSteps = nextInstruction
            ? `Next target: ${nextInstruction}`
            : `Next time, aim for the full ${targetReps} reps with the same weight.`;
        } else {
          message = `Solid effort today. You completed ${avgReps.toFixed(1)} reps on average.`;
          nextSteps = nextInstruction
            ? `Next target: ${nextInstruction}`
            : `Next time, focus on adding 1-2 reps per set. Progressive overload (more reps, then more weight) is key for hypertrophy.`;
        }
        
        setExerciseFeedback(prev => {
          const newMap = new Map(prev);
          newMap.set(exercise.id, { message, nextSteps });
          return newMap;
        });

        void checkForNewAchievements();
        
        // Reload data to update last session - add a small delay to ensure DB is updated
        setTimeout(async () => {
          console.log('Reloading workout data after save...');
          pendingScrollRef.current = exercise.id;
          await loadWorkoutData();
          console.log('Workout data reloaded');
        }, 500);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to save exercise:', errorData);
        const errorMsg = errorData.details || errorData.error || `HTTP ${response.status}`;
        alert(`Failed to save exercise: ${errorMsg}\n\nPlease check the browser console for more details.`);
      }
    } catch (error: unknown) {
      console.error('Error saving exercise:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error saving exercise: ${errorMsg}\n\nPlease check the browser console for more details.`);
    } finally {
      setSavingExerciseId(null);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const activeSequence = selectedSequence ?? suggestedSequence;
  const currentSequence = getSequenceDefinition(activeSequence);
  const recommendedSequence = getSequenceDefinition(suggestedSequence);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  return (
    <div className="space-y-6">
      {xpSummary && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Gamer Level</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">Lv {xpSummary.level}</p>
            </div>
            <div className="flex-1 sm:mx-6">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.round(xpSummary.progressPct * 100))}%` }}
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>{Math.round(xpSummary.xpIntoLevel)} / {Math.round(xpSummary.nextLevelXp)} XP</span>
                <span>{Math.round(xpSummary.xpToNext)} XP to next level</span>
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <p className="font-medium">Weekly XP</p>
              <p className="text-lg font-semibold">{Math.round(xpSummary.weekXp)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Hypertrophy Guide */}
      <HypertrophyGuide />

      <div className="surface-card p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
              Sequence Selector
            </p>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {currentSequence.label}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {currentSequence.description}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-300">
              Suggested next: {recommendedSequence.label}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {WORKOUT_SEQUENCES.map(sequence => {
              const isActive = sequence.id === activeSequence;
              return (
                <button
                  key={sequence.id}
                  type="button"
                  onClick={() => setSelectedSequence(sequence.id)}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition sm:min-w-[140px] ${
                    isActive
                      ? 'border-blue-500 bg-blue-600 text-white shadow-sm'
                      : 'border-gray-200 bg-white text-gray-800 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-blue-500 dark:hover:bg-gray-700'
                  }`}
                  aria-pressed={isActive}
                >
                  <span className="block text-sm font-semibold">{sequence.label}</span>
                  <span className={`block text-xs ${isActive ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                    {sequence.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Sequence */}
      <div className="space-y-6">
        {exercises.map((exercise, exIdx) => (
          <ExerciseSection
            key={exercise.id}
            exercise={exercise}
            exIdx={exIdx}
            saving={savingExerciseId === exercise.id}
            isSaved={savedExercises.has(exercise.id)}
            feedback={exerciseFeedback.get(exercise.id)}
            todayStr={todayStr}
            yesterdayStr={yesterdayStr}
            onUpdateSet={updateSet}
            onAddSet={addSet}
            onRemoveSet={removeSet}
            onSaveExercise={saveExercise}
          />
        ))}
      </div>

      {/* End Workout Button */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => {
            const unsavedExercises = exercises.filter(ex => !savedExercises.has(ex.id));
            if (unsavedExercises.length > 0) {
              const confirm = window.confirm(`You have ${unsavedExercises.length} unsaved exercise(s). End workout anyway?`);
              if (!confirm) return;
            }
            
            // Get completed exercises (only saved ones)
            const completedExercises = exercises
              .filter(ex => savedExercises.has(ex.id))
              .map(ex => ({
                id: ex.id,
                name: ex.name,
                sets: ex.sets.map(set => ({
                  reps: set.reps,
                  loadLbs: set.loadLbs,
                  rir: set.rir,
                })),
              }));
            
            if (completedExercises.length === 0) {
              alert('Please save at least one exercise before ending the workout.');
              return;
            }
            
            // Check for new achievements before showing summary
            checkForNewAchievements().then(() => {
              setShowSummaryModal(true);
            });
          }}
          className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-lg"
        >
          End Workout
        </button>
      </div>

      {/* Workout Summary Modal */}
      <WorkoutSummaryModal
        isOpen={showSummaryModal}
        onClose={() => {
          setShowSummaryModal(false);
          router.push('/');
        }}
        completedExercises={exercises
          .filter(ex => savedExercises.has(ex.id))
          .map(ex => ({
            id: ex.id,
            name: ex.name,
            sets: ex.sets.map(set => ({
              reps: set.reps,
              loadLbs: set.loadLbs,
              rir: set.rir,
            })),
          }))}
      />
    </div>
  );
}
