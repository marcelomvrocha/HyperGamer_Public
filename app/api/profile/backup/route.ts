import { NextResponse } from 'next/server';
import { getCurrentUserId, toPublicUser } from '@/lib/auth';
import { normalizeAvatarId } from '@/lib/avatars';
import { ensureExerciseRecords } from '@/lib/exercise-db';
import { normalizeExerciseName } from '@/lib/exercises';
import {
  buildBackupWorkoutSignature,
  buildExistingWorkoutSignature,
  buildProfileBackupSummary,
  parseProfileBackup,
  toDateOnlyString,
  toLocalDate,
  type BackupImportStats,
  type HyperGamerProfileBackup,
} from '@/lib/profile-backup';
import { prisma } from '@/lib/prisma';

function buildBackupFilename(): string {
  return `hypergamer-backup-${toDateOnlyString(new Date())}.json`;
}

export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        workouts: {
          orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
          include: {
            sets: {
              orderBy: { setIndex: 'asc' },
              include: {
                exercise: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        biometrics: {
          orderBy: { date: 'asc' },
        },
        nutritions: {
          orderBy: { date: 'asc' },
        },
        targets: {
          orderBy: { effectiveDate: 'asc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const backupData: HyperGamerProfileBackup['data'] = {
      workouts: user.workouts.map(workout => ({
        date: toDateOnlyString(workout.date),
        template: workout.template,
        duration: workout.duration ?? null,
        notes: workout.notes ?? null,
        sets: workout.sets.map(set => ({
          setIndex: set.setIndex,
          exerciseName: set.exercise.name,
          reps: set.reps,
          loadLbs: set.loadLbs ?? null,
          rir: set.rir ?? null,
          tempoEccSec: set.tempoEccSec ?? null,
          tempoPauseSec: set.tempoPauseSec ?? null,
          tempoConcSec: set.tempoConcSec ?? null,
          technique:
            set.technique === 'none' ||
            set.technique === 'restpause' ||
            set.technique === 'myoreps' ||
            set.technique === 'partials'
              ? set.technique
              : null,
          notes: set.notes ?? null,
        })),
      })),
      biometrics: user.biometrics.map(entry => ({
        date: toDateOnlyString(entry.date),
        weightKg: entry.weightKg,
        bfPercent: entry.bfPercent ?? null,
        lbmKg: entry.lbmKg ?? null,
        bmi: entry.bmi ?? null,
      })),
      nutritions: user.nutritions.map(entry => ({
        date: toDateOnlyString(entry.date),
        calories: entry.calories,
        proteinG: entry.proteinG,
        carbsG: entry.carbsG,
        fatG: entry.fatG,
      })),
      targets: user.targets.map(entry => ({
        effectiveDate: toDateOnlyString(entry.effectiveDate),
        caloriesTarget: entry.caloriesTarget,
        proteinTarget: entry.proteinTarget,
        workoutFrequency: entry.workoutFrequency,
        deloadFlag: entry.deloadFlag,
      })),
    };

    const backup: HyperGamerProfileBackup = {
      version: 1,
      schema: 'profile-backup',
      app: 'HyperGamer',
      exportedAt: new Date().toISOString(),
      user: {
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
      },
      data: backupData,
      summary: buildProfileBackupSummary(backupData),
    };

    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${buildBackupFilename()}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error exporting profile backup:', error);
    return NextResponse.json({ error: 'Failed to export backup.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload: unknown = await request.json();
    const backup = parseProfileBackup(payload);
    const exerciseNames = backup.data.workouts.flatMap(workout => workout.sets.map(set => set.exerciseName));
    const exerciseIdByName = await ensureExerciseRecords(exerciseNames);

    const stats: BackupImportStats = {
      profileUpdated: false,
      workoutsCreated: 0,
      workoutsSkipped: 0,
      workoutSetsImported: 0,
      biometricsUpserted: 0,
      nutritionsUpserted: 0,
      targetsCreated: 0,
      targetsUpdated: 0,
    };

    const importedUser = await prisma.$transaction(async tx => {
      const currentUser = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!currentUser) {
        throw new Error('User not found.');
      }

      const updateData: { displayName?: string; avatar?: string } = {};
      if (backup.user.displayName && backup.user.displayName !== currentUser.displayName) {
        updateData.displayName = backup.user.displayName;
      }
      if (backup.user.avatar) {
        const normalizedAvatar = normalizeAvatarId(backup.user.avatar);
        if (normalizedAvatar !== currentUser.avatar) {
          updateData.avatar = normalizedAvatar;
        }
      }

      let resolvedUser = currentUser;
      if (Object.keys(updateData).length > 0) {
        resolvedUser = await tx.user.update({
          where: { id: userId },
          data: updateData,
        });
        stats.profileUpdated = true;
      }

      for (const biometric of backup.data.biometrics) {
        const biometricDate = toLocalDate(biometric.date);
        biometricDate.setHours(0, 0, 0, 0);

        await tx.biometricsWeekly.upsert({
          where: {
            userId_date: {
              userId,
              date: biometricDate,
            },
          },
          update: {
            weightKg: biometric.weightKg,
            bfPercent: biometric.bfPercent,
            lbmKg: biometric.lbmKg,
            bmi: biometric.bmi,
          },
          create: {
            userId,
            date: biometricDate,
            weightKg: biometric.weightKg,
            bfPercent: biometric.bfPercent,
            lbmKg: biometric.lbmKg,
            bmi: biometric.bmi,
          },
        });
        stats.biometricsUpserted += 1;
      }

      for (const nutrition of backup.data.nutritions) {
        const nutritionDate = toLocalDate(nutrition.date);
        nutritionDate.setHours(0, 0, 0, 0);

        await tx.nutritionDaily.upsert({
          where: {
            userId_date: {
              userId,
              date: nutritionDate,
            },
          },
          update: {
            calories: nutrition.calories,
            proteinG: nutrition.proteinG,
            carbsG: nutrition.carbsG,
            fatG: nutrition.fatG,
          },
          create: {
            userId,
            date: nutritionDate,
            calories: nutrition.calories,
            proteinG: nutrition.proteinG,
            carbsG: nutrition.carbsG,
            fatG: nutrition.fatG,
          },
        });
        stats.nutritionsUpserted += 1;
      }

      for (const target of backup.data.targets) {
        const effectiveDate = toLocalDate(target.effectiveDate);
        effectiveDate.setHours(0, 0, 0, 0);

        const existingTarget = await tx.target.findFirst({
          where: {
            userId,
            effectiveDate,
          },
        });

        if (existingTarget) {
          await tx.target.update({
            where: { id: existingTarget.id },
            data: {
              caloriesTarget: target.caloriesTarget,
              proteinTarget: target.proteinTarget,
              workoutFrequency: target.workoutFrequency,
              deloadFlag: target.deloadFlag,
            },
          });
          stats.targetsUpdated += 1;
        } else {
          await tx.target.create({
            data: {
              userId,
              effectiveDate,
              caloriesTarget: target.caloriesTarget,
              proteinTarget: target.proteinTarget,
              workoutFrequency: target.workoutFrequency,
              deloadFlag: target.deloadFlag,
            },
          });
          stats.targetsCreated += 1;
        }
      }

      for (const workout of backup.data.workouts) {
        const workoutDate = toLocalDate(workout.date);
        workoutDate.setHours(0, 0, 0, 0);

        const matchingWorkouts = await tx.workout.findMany({
          where: {
            userId,
            date: workoutDate,
            template: workout.template,
          },
          include: {
            sets: {
              orderBy: { setIndex: 'asc' },
              include: {
                exercise: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        });

        const importedSignature = buildBackupWorkoutSignature(workout);
        const hasExistingMatch = matchingWorkouts.some(existingWorkout =>
          buildExistingWorkoutSignature(existingWorkout) === importedSignature
        );

        if (hasExistingMatch) {
          stats.workoutsSkipped += 1;
          continue;
        }

        await tx.workout.create({
          data: {
            userId,
            date: workoutDate,
            template: workout.template,
            duration: workout.duration,
            notes: workout.notes,
            sets: {
              create: workout.sets
                .slice()
                .sort((a, b) => a.setIndex - b.setIndex)
                .map(set => {
                  const resolvedExerciseId = exerciseIdByName.get(normalizeExerciseName(set.exerciseName));

                  if (!resolvedExerciseId) {
                    throw new Error(`Imported exercise "${set.exerciseName}" could not be matched in the database.`);
                  }

                  return {
                    setIndex: set.setIndex,
                    reps: set.reps,
                    loadLbs: set.loadLbs,
                    rir: set.rir,
                    tempoEccSec: set.tempoEccSec,
                    tempoPauseSec: set.tempoPauseSec,
                    tempoConcSec: set.tempoConcSec,
                    technique: set.technique ?? 'none',
                    notes: set.notes,
                    exercise: {
                      connect: {
                        id: resolvedExerciseId,
                      },
                    },
                  };
                }),
            },
          },
        });

        stats.workoutsCreated += 1;
        stats.workoutSetsImported += workout.sets.length;
      }

      return resolvedUser;
    });

    return NextResponse.json({
      success: true,
      user: toPublicUser(importedUser),
      imported: stats,
      summary: backup.summary,
    });
  } catch (error) {
    console.error('Error importing profile backup:', error);
    const message = error instanceof Error ? error.message : 'Failed to import backup.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
