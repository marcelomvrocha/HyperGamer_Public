import {
  findExerciseById,
  getSequenceExerciseIds,
  isBodyweightExercise,
  type WorkoutSequenceId,
} from './exercises';

export interface SetData {
  reps: number;
  loadLbs?: number;
  rir?: number;
  tempoEccSec?: number;
  tempoPauseSec?: number;
  tempoConcSec?: number;
  technique?: 'none' | 'restpause' | 'myoreps' | 'partials';
}

export interface LastSession {
  exerciseId: string;
  date?: string;
  sets: SetData[];
}

export interface NextTarget {
  exerciseId: string;
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
}

export type ProgressionStep = 'Reps' | 'Tempo' | 'Pause' | 'Technique';

export function getProgressionStep(sets: NextTarget['sets']): ProgressionStep {
  const anchor = sets[0];
  if (!anchor) return 'Reps';
  if (anchor.technique && anchor.technique !== 'none') return 'Technique';
  if (anchor.tempoPauseSec && anchor.tempoPauseSec >= 1) return 'Pause';
  if (anchor.tempoEccSec && anchor.tempoEccSec >= 3) return 'Tempo';
  return 'Reps';
}

/**
 * Progression hierarchy for capped dumbbells:
 * 1. Add reps within target range
 * 2. Add tempo constraint
 * 3. Add pause
 * 4. Add intensity technique (rest-pause/myoreps)
 * 5. Add sets (within weekly cap)
 * 6. Reduce rest (handled by user, not app)
 */
export function calculateNextTarget(
  exerciseId: string,
  lastSessions: LastSession[]
): NextTarget {
  const exercise = findExerciseById(exerciseId);
  if (!exercise) {
    throw new Error(`Exercise ${exerciseId} not found`);
  }

  // Get most recent session for this exercise
  const lastSession = lastSessions
    .filter(s => s.exerciseId === exerciseId)
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    })[0];

  if (!lastSession || lastSession.sets.length === 0) {
    // First time - start conservative with 3 sets
    const isBodyweight = isBodyweightExercise(exercise);
    const isSplitSquat = exercise.id === 'split-squat';
    const weightInstruction = isBodyweight 
      ? ' (bodyweight - select "Bodyweight (BW)" in the load field)' 
      : isSplitSquat
      ? ' - select your starting weight per hand (e.g., 20 lbs/hand)'
      : ' - select your starting weight (e.g., 40 lbs)';
    
    return {
      exerciseId,
      sets: Array.from({ length: 3 }, () => ({
        targetReps: exercise.defaultRepRangeMin,
        tempoEccSec: 2,
        tempoConcSec: 1,
        targetRir: 2,
        instruction: `Start with ${exercise.defaultRepRangeMin} reps${weightInstruction}, focus on 2-0-1 tempo (2 sec down, 0 pause, 1 sec up). Target RIR 2.`,
      })),
    };
  }

  const lastSets = lastSession.sets;
  const avgReps = lastSets.reduce((sum, s) => sum + s.reps, 0) / lastSets.length;
  const maxReps = Math.max(...lastSets.map(s => s.reps));

  const rirValues = lastSets
    .map(s => s.rir)
    .filter((rir): rir is number => typeof rir === 'number' && !Number.isNaN(rir));
  const hasRirData = rirValues.length >= Math.ceil(lastSets.length / 2);
  const avgRir = rirValues.length > 0 ? rirValues.reduce((sum, rir) => sum + rir, 0) / rirValues.length : null;
  const repBump = hasRirData && avgRir !== null && avgRir >= 3 ? 2 : 1;

  const hasRestPause = lastSets.some(s => s.technique === 'restpause');
  const hasMyoReps = lastSets.some(s => s.technique === 'myoreps');
  const hasTempo = lastSets.some(s => s.tempoEccSec && s.tempoEccSec >= 3);
  const hasPause = lastSets.some(s => s.tempoPauseSec && s.tempoPauseSec >= 1);

  // Check if this is a bodyweight exercise
  const isBodyweight = isBodyweightExercise(exercise);

  const sets: NextTarget['sets'] = [];

  // Rule 1: If max reps is below target range, add reps
  if (maxReps < exercise.defaultRepRangeMax && !hasRestPause && !hasMyoReps) {
    const targetReps = Math.min(maxReps + repBump, exercise.defaultRepRangeMax);
    // Find weight from any set that has it (not just first set)
    const lastWeight = lastSets.find(s => s.loadLbs !== null && s.loadLbs !== undefined)?.loadLbs;
    const weightText = lastWeight ? ` @ ${lastWeight}lbs` : '';
    const weightInstruction = isBodyweight 
      ? ' (bodyweight - select "Bodyweight (BW)" in the load field)' 
      : weightText ? ` @ ${lastWeight}lbs` : '';
    const suggestedSets = Math.min(4, Math.max(3, Math.ceil(lastSets.length / 2))); // 3-4 sets typically
    
    for (let i = 0; i < suggestedSets; i++) {
      sets.push({
        targetReps,
        targetLoadLbs: lastWeight,
        tempoEccSec: lastSets[0]?.tempoEccSec || 2,
        tempoPauseSec: lastSets[0]?.tempoPauseSec,
        tempoConcSec: lastSets[0]?.tempoConcSec || 1,
        technique: 'none',
        targetRir: 2,
        instruction: isBodyweight
          ? `Aim for ${targetReps} reps${weightInstruction}, same tempo as last time. Target RIR 1-2.`
          : `Aim for ${targetReps} reps${weightText}, same weight and tempo as last time. Target RIR 1-2.`,
      });
    }
    return { exerciseId, sets };
  }

  // Rule 2: If in target range but no tempo, add 3-sec eccentric
  if (
    avgReps >= exercise.defaultRepRangeMin &&
    avgReps <= exercise.defaultRepRangeMax &&
    !hasTempo
  ) {
    const targetReps = Math.floor(avgReps * 0.9); // Reduce slightly for tempo
    // Find weight from any set that has it (not just first set)
    const lastWeight = lastSets.find(s => s.loadLbs !== null && s.loadLbs !== undefined)?.loadLbs;
    const weightText = lastWeight ? ` @ ${lastWeight}lbs` : '';
    const suggestedSets = Math.min(4, Math.max(3, Math.ceil(lastSets.length / 2))); // 3-4 sets typically
    
    for (let i = 0; i < suggestedSets; i++) {
      sets.push({
        targetReps,
        targetLoadLbs: lastWeight,
        tempoEccSec: 3,
        tempoPauseSec: lastSets[0]?.tempoPauseSec,
        tempoConcSec: 1,
        technique: 'none',
        targetRir: 1,
        instruction: `Aim for ${targetReps} reps${weightText} with 3-sec eccentric. Target RIR 1-2.`,
      });
    }
    return { exerciseId, sets };
  }

  // Rule 3: If has tempo but no pause, add 1-sec pause
  if (hasTempo && !hasPause) {
    const targetReps = Math.floor(avgReps * 0.95);
    // Find weight from any set that has it (not just first set)
    const lastWeight = lastSets.find(s => s.loadLbs !== null && s.loadLbs !== undefined)?.loadLbs;
    const weightText = lastWeight ? ` @ ${lastWeight}lbs` : '';
    const suggestedSets = Math.min(4, Math.max(3, Math.ceil(lastSets.length / 2))); // 3-4 sets typically
    
    for (let i = 0; i < suggestedSets; i++) {
      sets.push({
        targetReps,
        targetLoadLbs: lastWeight,
        tempoEccSec: lastSets[0]?.tempoEccSec || 3,
        tempoPauseSec: 1,
        tempoConcSec: 1,
        technique: 'none',
        targetRir: 1,
        instruction: `Aim for ${targetReps} reps${weightText} with 1-sec pause at bottom. Target RIR 1-2.`,
      });
    }
    return { exerciseId, sets };
  }

  // Rule 4: If maxed on tempo/pause but no intensity technique, add rest-pause
  if (hasTempo && hasPause && !hasRestPause && !hasMyoReps) {
    const targetReps = Math.floor(avgReps * 0.8);
    // Find weight from any set that has it (not just first set)
    const lastWeight = lastSets.find(s => s.loadLbs !== null && s.loadLbs !== undefined)?.loadLbs;
    const weightText = lastWeight ? ` @ ${lastWeight}lbs` : '';
    const suggestedSets = Math.min(4, Math.max(3, Math.ceil(lastSets.length / 2))); // 3-4 sets typically
    
    for (let i = 0; i < suggestedSets; i++) {
      sets.push({
        targetReps,
        targetLoadLbs: lastWeight,
        tempoEccSec: lastSets[0]?.tempoEccSec || 3,
        tempoPauseSec: lastSets[0]?.tempoPauseSec || 1,
        tempoConcSec: 1,
        technique: 'restpause',
        targetRir: 0,
        instruction: `Aim for ${targetReps} reps${weightText}, then rest-pause cluster for +4-6 reps. Target RIR 0-1 on final mini-set.`,
      });
    }
    return { exerciseId, sets };
  }

  // Rule 5: Already using techniques - maintain and try to add 1 rep total across sets
  if (hasRestPause || hasMyoReps) {
    const baseReps = Math.floor(avgReps);
    // Find weight from any set that has it (not just first set)
    const lastWeight = lastSets.find(s => s.loadLbs !== null && s.loadLbs !== undefined)?.loadLbs;
    const weightText = lastWeight ? ` @ ${lastWeight}lbs` : '';
    const techniqueName = hasRestPause ? 'rest-pause' : 'myo-reps';
    const suggestedSets = Math.min(4, Math.max(3, Math.ceil(lastSets.length / 2))); // 3-4 sets typically
    
    for (let i = 0; i < suggestedSets; i++) {
      sets.push({
        targetReps: baseReps,
        targetLoadLbs: lastWeight,
        tempoEccSec: lastSets[0]?.tempoEccSec || 3,
        tempoPauseSec: lastSets[0]?.tempoPauseSec || 1,
        tempoConcSec: 1,
        technique: hasRestPause ? 'restpause' : 'myoreps',
        targetRir: 0,
        instruction: `Maintain ${baseReps} reps${weightText} base, add 1-2 total reps in ${techniqueName} cluster. Target RIR 0-1 on final mini-set.`,
      });
    }
    return { exerciseId, sets };
  }

  // Fallback: maintain current (limit to 3-4 sets for hypertrophy)
  // Use average reps and weight from last session, suggest 3-4 sets
  // Note: avgReps is already calculated above, so we reuse it
  const avgWeight = lastSets.find(s => s.loadLbs)?.loadLbs;
  const suggestedSets = Math.min(4, Math.max(3, Math.ceil(lastSets.length / 2))); // 3-4 sets typically
  
  return {
    exerciseId,
    sets: Array.from({ length: suggestedSets }, () => {
      const weightText = avgWeight ? ` @ ${avgWeight}lbs` : '';
      const fallbackTechnique = lastSets[0]?.technique || 'none';
      const fallbackRir = fallbackTechnique === 'restpause' || fallbackTechnique === 'myoreps' ? 0 : 2;
      return {
        targetReps: Math.round(avgReps),
        targetLoadLbs: avgWeight,
        tempoEccSec: lastSets[0]?.tempoEccSec || 2,
        tempoPauseSec: lastSets[0]?.tempoPauseSec,
        tempoConcSec: lastSets[0]?.tempoConcSec || 1,
        technique: fallbackTechnique,
        targetRir: fallbackRir,
        instruction: `Aim for ${Math.round(avgReps)} reps${weightText}, same parameters as last time. Target RIR ${fallbackRir === 0 ? '0-1' : '1-2'}.`,
      };
    }),
  };
}

/**
 * Calculate progression suggestions for all exercises in a workout template
 */
export function getWorkoutTargets(
  sequence: WorkoutSequenceId,
  lastSessions: LastSession[]
): NextTarget[] {
  return getSequenceExerciseIds(sequence).map(exerciseId =>
    calculateNextTarget(exerciseId, lastSessions)
  );
}
