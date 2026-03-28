/**
 * Analyze workout for lean muscle mass building potential
 */

export interface WorkoutAnalysis {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  volumeScore: number; // 0-100
  progressionScore: number; // 0-100
  overallScore: number; // 0-100
}

export interface ExerciseData {
  name: string;
  sets: number;
  reps: number[];
  weight?: number;
  pattern: 'push' | 'pull' | 'hinge' | 'squat' | 'core';
}

/**
 * Analyze current workout for hypertrophy potential
 */
export function analyzeWorkout(exercises: ExerciseData[]): WorkoutAnalysis {
  const analysis: WorkoutAnalysis = {
    strengths: [],
    weaknesses: [],
    recommendations: [],
    volumeScore: 0,
    progressionScore: 0,
    overallScore: 0,
  };

  // Count patterns
  const patternCounts = {
    push: 0,
    pull: 0,
    hinge: 0,
    squat: 0,
    core: 0,
  };

  let totalSets = 0;
  const repRanges: number[] = [];

  exercises.forEach(ex => {
    patternCounts[ex.pattern]++;
    const sets = ex.sets;
    totalSets += sets;
    
    ex.reps.forEach(reps => {
      repRanges.push(reps);
    });
  });

  // Volume analysis
  const avgReps = repRanges.reduce((a, b) => a + b, 0) / repRanges.length;
  const setsPerMuscleGroup = totalSets / Object.keys(patternCounts).length;

  // Volume score (10-20 sets per muscle group per week is ideal for hypertrophy)
  // Assuming 2-3 workouts per week, need 4-7 sets per workout per pattern
  analysis.volumeScore = Math.min(100, (setsPerMuscleGroup / 6) * 100);

  // Progression score (based on rep ranges - 6-20 reps is good for hypertrophy)
  const repsInRange = repRanges.filter(r => r >= 6 && r <= 20).length;
  analysis.progressionScore = (repsInRange / repRanges.length) * 100;

  // Strengths
  if (patternCounts.push > 0 && patternCounts.pull > 0) {
    analysis.strengths.push('Good push/pull balance');
  }
  if (patternCounts.squat > 0 && patternCounts.hinge > 0) {
    analysis.strengths.push('Lower body well covered (squat + hinge)');
  }
  if (avgReps >= 6 && avgReps <= 20) {
    analysis.strengths.push('Rep ranges in hypertrophy zone (6-20)');
  }
  if (totalSets >= 10) {
    analysis.strengths.push('Adequate total volume');
  }

  // Weaknesses
  if (patternCounts.pull < patternCounts.push) {
    analysis.weaknesses.push('Pull volume lower than push (imbalance risk)');
  }
  if (setsPerMuscleGroup < 4) {
    analysis.weaknesses.push('Low sets per muscle group (may limit growth)');
  }
  if (avgReps < 6) {
    analysis.weaknesses.push('Some rep ranges too low for hypertrophy (strength-focused)');
  }
  if (patternCounts.core > 2) {
    analysis.weaknesses.push('Excessive core work (may interfere with recovery)');
  }

  // Recommendations for lean muscle mass
  if (patternCounts.pull === 1 && patternCounts.push >= 2) {
    analysis.recommendations.push('Add 1-2 more pulling exercises (rows, pull-ups, face pulls)');
  }
  if (setsPerMuscleGroup < 4) {
    analysis.recommendations.push(`Increase sets to 4-6 per exercise for better hypertrophy stimulus`);
  }
  if (avgReps < 8) {
    analysis.recommendations.push('Increase rep ranges to 8-15 for better muscle growth');
  }
  if (totalSets < 12) {
    analysis.recommendations.push('Add 2-4 more sets total for increased volume');
  }
  if (patternCounts.core > 2) {
    analysis.recommendations.push('Reduce core work to 1-2 exercises, focus on compounds');
  }

  // Specific recommendations based on current workout
  const hasPullups = exercises.some(e => e.name.toLowerCase().includes('pull'));
  if (hasPullups) {
    const pullupEx = exercises.find(e => e.name.toLowerCase().includes('pull'));
    if (pullupEx && pullupEx.reps.some(r => r < 5)) {
      analysis.recommendations.push('Pull-ups: Use assistance or negatives to get 6-10 reps per set');
    }
  }

  const hasFloorPress = exercises.some(e => e.name.toLowerCase().includes('floor press'));
  if (hasFloorPress) {
    analysis.recommendations.push('Floor Press: Add pause at bottom (1-2 sec) to increase time under tension');
  }

  const hasSplitSquat = exercises.some(e => e.name.toLowerCase().includes('split'));
  if (hasSplitSquat) {
    analysis.recommendations.push('Split Squats: Add 2-sec pause at bottom for more quad stimulus');
  }

  // Overall score
  analysis.overallScore = (analysis.volumeScore * 0.4 + analysis.progressionScore * 0.4 + 
    (analysis.strengths.length / 5) * 100 * 0.2);

  return analysis;
}

/**
 * Parse user's workout data
 */
export function parseUserWorkout(): ExerciseData[] {
  // Based on user's provided workout
  return [
    {
      name: 'Regular Pullups',
      sets: 3,
      reps: [2, 2, 1],
      pattern: 'pull',
    },
    {
      name: 'Bulgarian Split Squat (Left)',
      sets: 3,
      reps: [10, 10, 10],
      weight: 40,
      pattern: 'squat',
    },
    {
      name: 'Bulgarian Split Squat (Right)',
      sets: 3,
      reps: [10, 10, 10],
      weight: 40,
      pattern: 'squat',
    },
    {
      name: 'Single-Leg Romanian Deadlift (Left)',
      sets: 3,
      reps: [10, 10, 10],
      weight: 7,
      pattern: 'hinge',
    },
    {
      name: 'Single-Leg Romanian Deadlift (Right)',
      sets: 3,
      reps: [10, 10, 10],
      weight: 7,
      pattern: 'hinge',
    },
    {
      name: 'Dumbbell Floor Press',
      sets: 3,
      reps: [10, 10, 10],
      weight: 40,
      pattern: 'push',
    },
    {
      name: 'Pike Push-ups',
      sets: 3,
      reps: [8, 7, 6],
      pattern: 'push',
    },
    {
      name: 'One Arm Dumbbell Row (Left)',
      sets: 3,
      reps: [11, 11, 11],
      weight: 52.5,
      pattern: 'pull',
    },
    {
      name: 'One Arm Dumbbell Row (Right)',
      sets: 3,
      reps: [11, 11, 11],
      weight: 52.5,
      pattern: 'pull',
    },
    {
      name: 'Hanging Leg Raises',
      sets: 3,
      reps: [11, 11, 11],
      pattern: 'core',
    },
    {
      name: 'Dumbbell Side Bend (Right)',
      sets: 3,
      reps: [13, 11, 9],
      weight: 40,
      pattern: 'core',
    },
    {
      name: 'Dumbbell Side Bend (Left)',
      sets: 3,
      reps: [13, 11, 9],
      weight: 40,
      pattern: 'core',
    },
  ];
}
