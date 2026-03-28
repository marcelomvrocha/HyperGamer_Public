import { normalizeExerciseName } from '@/lib/exercises';

export type BackupTechnique = 'none' | 'restpause' | 'myoreps' | 'partials';

export interface BackupWorkoutSet {
  setIndex: number;
  exerciseName: string;
  reps: number;
  loadLbs: number | null;
  rir: number | null;
  tempoEccSec: number | null;
  tempoPauseSec: number | null;
  tempoConcSec: number | null;
  technique: BackupTechnique | null;
  notes: string | null;
}

export interface BackupWorkout {
  date: string;
  template: string;
  duration: number | null;
  notes: string | null;
  sets: BackupWorkoutSet[];
}

export interface BackupBiometricEntry {
  date: string;
  weightKg: number;
  bfPercent: number | null;
  lbmKg: number | null;
  bmi: number | null;
}

export interface BackupNutritionEntry {
  date: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface BackupTargetEntry {
  effectiveDate: string;
  caloriesTarget: number;
  proteinTarget: number;
  workoutFrequency: number;
  deloadFlag: boolean;
}

export interface HyperGamerProfileBackup {
  version: 1;
  schema: 'profile-backup';
  app: 'HyperGamer';
  exportedAt: string;
  user: {
    email: string | null;
    displayName: string | null;
    avatar: string | null;
  };
  data: {
    workouts: BackupWorkout[];
    biometrics: BackupBiometricEntry[];
    nutritions: BackupNutritionEntry[];
    targets: BackupTargetEntry[];
  };
  summary: {
    workouts: number;
    sets: number;
    biometrics: number;
    nutritions: number;
    targets: number;
  };
}

export interface BackupImportStats {
  profileUpdated: boolean;
  workoutsCreated: number;
  workoutsSkipped: number;
  workoutSetsImported: number;
  biometricsUpserted: number;
  nutritionsUpserted: number;
  targetsCreated: number;
  targetsUpdated: number;
}

type ExistingWorkoutForSignature = {
  date: string | Date;
  template?: string | null;
  duration?: number | null;
  notes?: string | null;
  sets?: Array<{
    setIndex: number;
    reps: number;
    loadLbs?: number | null;
    rir?: number | null;
    tempoEccSec?: number | null;
    tempoPauseSec?: number | null;
    tempoConcSec?: number | null;
    technique?: string | null;
    notes?: string | null;
    exercise?: {
      name?: string | null;
    } | null;
  }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function requireString(value: unknown, label: string): string {
  const parsed = toTrimmedString(value);
  if (!parsed) {
    throw new Error(`${label} is required.`);
  }
  return parsed;
}

function toNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function requirePositiveNumber(value: unknown, label: string): number {
  const parsed = toNullableNumber(value);
  if (parsed === null || parsed <= 0) {
    throw new Error(`${label} must be a positive number.`);
  }
  return parsed;
}

function requireWholeNumber(value: unknown, label: string): number {
  const parsed = toNullableNumber(value);
  if (parsed === null || !Number.isInteger(parsed)) {
    throw new Error(`${label} must be a whole number.`);
  }
  return parsed;
}

function toNullableInteger(value: unknown): number | null {
  const parsed = toNullableNumber(value);
  if (parsed === null) {
    return null;
  }
  return Number.isInteger(parsed) ? parsed : Math.round(parsed);
}

function normalizeTechnique(value: unknown): BackupTechnique | null {
  switch (value) {
    case 'none':
    case 'restpause':
    case 'myoreps':
    case 'partials':
      return value;
    default:
      return null;
  }
}

function requireObject(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value;
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }
  return value;
}

export function toDateOnlyString(dateInput: string | Date): string {
  if (typeof dateInput === 'string') {
    const match = dateInput.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) {
      return match[1];
    }
  }

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toLocalDate(dateInput: string | Date): Date {
  const dateOnly = toDateOnlyString(dateInput);
  const [year, month, day] = dateOnly.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function buildProfileBackupSummary(data: HyperGamerProfileBackup['data']): HyperGamerProfileBackup['summary'] {
  return {
    workouts: data.workouts.length,
    sets: data.workouts.reduce((sum, workout) => sum + workout.sets.length, 0),
    biometrics: data.biometrics.length,
    nutritions: data.nutritions.length,
    targets: data.targets.length,
  };
}

function normalizeNotes(value: unknown): string | null {
  return toTrimmedString(value);
}

function normalizeWorkoutSetForSignature(set: BackupWorkoutSet) {
  return {
    setIndex: set.setIndex,
    exerciseName: normalizeExerciseName(set.exerciseName),
    reps: set.reps,
    loadLbs: set.loadLbs,
    rir: set.rir,
    tempoEccSec: set.tempoEccSec,
    tempoPauseSec: set.tempoPauseSec,
    tempoConcSec: set.tempoConcSec,
    technique: set.technique ?? 'none',
    notes: set.notes,
  };
}

export function buildBackupWorkoutSignature(workout: BackupWorkout): string {
  return JSON.stringify({
    date: toDateOnlyString(workout.date),
    template: workout.template.trim(),
    duration: workout.duration,
    notes: workout.notes,
    sets: [...workout.sets]
      .sort((a, b) => a.setIndex - b.setIndex)
      .map(normalizeWorkoutSetForSignature),
  });
}

export function buildExistingWorkoutSignature(workout: ExistingWorkoutForSignature): string {
  return JSON.stringify({
    date: toDateOnlyString(workout.date),
    template: toTrimmedString(workout.template) ?? '',
    duration: toNullableInteger(workout.duration),
    notes: normalizeNotes(workout.notes),
    sets: [...(workout.sets ?? [])]
      .sort((a, b) => a.setIndex - b.setIndex)
      .map(set => ({
        setIndex: set.setIndex,
        exerciseName: normalizeExerciseName(set.exercise?.name ?? ''),
        reps: set.reps,
        loadLbs: toNullableNumber(set.loadLbs),
        rir: toNullableInteger(set.rir),
        tempoEccSec: toNullableInteger(set.tempoEccSec),
        tempoPauseSec: toNullableInteger(set.tempoPauseSec),
        tempoConcSec: toNullableInteger(set.tempoConcSec),
        technique: normalizeTechnique(set.technique) ?? 'none',
        notes: normalizeNotes(set.notes),
      })),
  });
}

export function parseProfileBackup(payload: unknown): HyperGamerProfileBackup {
  const root = requireObject(payload, 'Backup');
  const version = root.version;
  if (version !== 1) {
    throw new Error('Only backup version 1 is currently supported.');
  }

  const data = requireObject(root.data, 'Backup data');
  const workoutRows = requireArray(data.workouts ?? [], 'Backup workouts');
  const biometricRows = requireArray(data.biometrics ?? [], 'Backup biometrics');
  const nutritionRows = requireArray(data.nutritions ?? [], 'Backup nutritions');
  const targetRows = requireArray(data.targets ?? [], 'Backup targets');

  const workouts: BackupWorkout[] = workoutRows.map((row, workoutIndex) => {
    const record = requireObject(row, `Workout ${workoutIndex + 1}`);
    const setRows = requireArray(record.sets, `Workout ${workoutIndex + 1} sets`);

    const sets: BackupWorkoutSet[] = setRows.map((setRow, setIndex) => {
      const setRecord = requireObject(setRow, `Workout ${workoutIndex + 1} set ${setIndex + 1}`);
      return {
        setIndex: toNullableInteger(setRecord.setIndex) ?? setIndex,
        exerciseName: requireString(setRecord.exerciseName, `Workout ${workoutIndex + 1} set ${setIndex + 1} exerciseName`),
        reps: requireWholeNumber(setRecord.reps, `Workout ${workoutIndex + 1} set ${setIndex + 1} reps`),
        loadLbs: toNullableNumber(setRecord.loadLbs),
        rir: toNullableInteger(setRecord.rir),
        tempoEccSec: toNullableInteger(setRecord.tempoEccSec),
        tempoPauseSec: toNullableInteger(setRecord.tempoPauseSec),
        tempoConcSec: toNullableInteger(setRecord.tempoConcSec),
        technique: normalizeTechnique(setRecord.technique),
        notes: normalizeNotes(setRecord.notes),
      };
    });

    return {
      date: toDateOnlyString(requireString(record.date, `Workout ${workoutIndex + 1} date`)),
      template: requireString(record.template, `Workout ${workoutIndex + 1} template`),
      duration: toNullableInteger(record.duration),
      notes: normalizeNotes(record.notes),
      sets,
    };
  });

  const biometrics: BackupBiometricEntry[] = biometricRows.map((row, index) => {
    const record = requireObject(row, `Biometric ${index + 1}`);
    return {
      date: toDateOnlyString(requireString(record.date, `Biometric ${index + 1} date`)),
      weightKg: requirePositiveNumber(record.weightKg, `Biometric ${index + 1} weightKg`),
      bfPercent: toNullableNumber(record.bfPercent),
      lbmKg: toNullableNumber(record.lbmKg),
      bmi: toNullableNumber(record.bmi),
    };
  });

  const nutritions: BackupNutritionEntry[] = nutritionRows.map((row, index) => {
    const record = requireObject(row, `Nutrition ${index + 1}`);
    return {
      date: toDateOnlyString(requireString(record.date, `Nutrition ${index + 1} date`)),
      calories: requireWholeNumber(record.calories, `Nutrition ${index + 1} calories`),
      proteinG: requireWholeNumber(record.proteinG, `Nutrition ${index + 1} proteinG`),
      carbsG: requireWholeNumber(record.carbsG, `Nutrition ${index + 1} carbsG`),
      fatG: requireWholeNumber(record.fatG, `Nutrition ${index + 1} fatG`),
    };
  });

  const targets: BackupTargetEntry[] = targetRows.map((row, index) => {
    const record = requireObject(row, `Target ${index + 1}`);
    return {
      effectiveDate: toDateOnlyString(requireString(record.effectiveDate, `Target ${index + 1} effectiveDate`)),
      caloriesTarget: requireWholeNumber(record.caloriesTarget, `Target ${index + 1} caloriesTarget`),
      proteinTarget: requireWholeNumber(record.proteinTarget, `Target ${index + 1} proteinTarget`),
      workoutFrequency: requireWholeNumber(record.workoutFrequency, `Target ${index + 1} workoutFrequency`),
      deloadFlag: Boolean(record.deloadFlag),
    };
  });

  const userRecord = isRecord(root.user) ? root.user : {};
  const backup: HyperGamerProfileBackup = {
    version: 1,
    schema: 'profile-backup',
    app: 'HyperGamer',
    exportedAt: toTrimmedString(root.exportedAt) ?? new Date().toISOString(),
    user: {
      email: toTrimmedString(userRecord.email),
      displayName: toTrimmedString(userRecord.displayName),
      avatar: toTrimmedString(userRecord.avatar),
    },
    data: {
      workouts,
      biometrics,
      nutritions,
      targets,
    },
    summary: buildProfileBackupSummary({
      workouts,
      biometrics,
      nutritions,
      targets,
    }),
  };

  return backup;
}
