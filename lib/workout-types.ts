import type { WorkoutLike, WorkoutSet } from './xp';

export type LoggedTechnique = 'none' | 'restpause' | 'myoreps' | 'partials';

export interface DatabaseExerciseRecord {
  id: string;
  name: string;
}

export interface WorkoutExerciseRecord {
  id?: string | null;
  name?: string | null;
}

export interface WorkoutSetRecord extends WorkoutSet {
  notes?: string | null;
  exercise?: WorkoutExerciseRecord | null;
}

export interface WorkoutRecord extends WorkoutLike {
  id?: string;
  template?: string | null;
  createdAt?: string | Date;
  sets?: WorkoutSetRecord[];
}

export interface WorkoutSetInput {
  exerciseId?: string;
  reps?: number;
  loadLbs?: number | null;
  rir?: number | null;
  tempoEccSec?: number | null;
  tempoPauseSec?: number | null;
  tempoConcSec?: number | null;
  technique?: LoggedTechnique | null;
  notes?: string | null;
}

export function normalizeTechnique(value: unknown): LoggedTechnique | undefined {
  switch (value) {
    case 'none':
    case 'restpause':
    case 'myoreps':
    case 'partials':
      return value;
    default:
      return undefined;
  }
}
