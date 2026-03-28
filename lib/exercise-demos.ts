/**
 * Exercise demonstration URLs and resources
 * Using YouTube embeds and exercise database references
 */
export interface ExerciseDemo {
  videoUrl?: string;
  imageUrl?: string;
  instructions: string;
  targetMuscles: string[];
  commonMistakes?: string[];
}

export const EXERCISE_DEMOS: Record<string, ExerciseDemo> = {
  'Pull-ups': {
    videoUrl: 'https://www.youtube.com/embed/eGo4IYlbE5g',
    instructions: 'Hang from bar with overhand grip, pull body up until chin clears bar, lower with control',
    targetMuscles: ['Latissimus Dorsi', 'Biceps', 'Rhomboids', 'Rear Delts'],
    commonMistakes: ['Kipping/swinging', 'Not going full range of motion', 'Rushing the negative']
  },
  'Regular Pullups': {
    videoUrl: 'https://www.youtube.com/embed/eGo4IYlbE5g',
    instructions: 'Hang from bar with overhand grip, pull body up until chin clears bar, lower with control',
    targetMuscles: ['Latissimus Dorsi', 'Biceps', 'Rhomboids', 'Rear Delts'],
    commonMistakes: ['Kipping/swinging', 'Not going full range of motion', 'Rushing the negative']
  },
  'Bulgarian Split Squat': {
    videoUrl: 'https://www.youtube.com/embed/2C-uNgKwPLE',
    instructions: 'Rear foot elevated on bench, front leg does all the work. Lower until front thigh is parallel to floor',
    targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
    commonMistakes: ['Leaning too far forward', 'Knee caving inward', 'Not going deep enough']
  },
  'Bulgarian Split Squat (Left)': {
    videoUrl: 'https://www.youtube.com/embed/2C-uNgKwPLE',
    instructions: 'Rear foot elevated on bench, front leg does all the work. Lower until front thigh is parallel to floor',
    targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
    commonMistakes: ['Leaning too far forward', 'Knee caving inward', 'Not going deep enough']
  },
  'Bulgarian Split Squat (Right)': {
    videoUrl: 'https://www.youtube.com/embed/2C-uNgKwPLE',
    instructions: 'Rear foot elevated on bench, front leg does all the work. Lower until front thigh is parallel to floor',
    targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
    commonMistakes: ['Leaning too far forward', 'Knee caving inward', 'Not going deep enough']
  },
  'Single-Leg Romanian Deadlift': {
    videoUrl: 'https://www.youtube.com/embed/43sDDqHqj0E',
    instructions: 'Stand on one leg, hinge at hip, lower weight while raising opposite leg. Keep back straight, core tight',
    targetMuscles: ['Hamstrings', 'Glutes', 'Erector Spinae', 'Core'],
    commonMistakes: ['Rounding the back', 'Rotating hips', 'Not maintaining balance']
  },
  'Single-Leg Romanian Deadlift (Left)': {
    videoUrl: 'https://www.youtube.com/embed/43sDDqHqj0E',
    instructions: 'Stand on one leg, hinge at hip, lower weight while raising opposite leg. Keep back straight, core tight',
    targetMuscles: ['Hamstrings', 'Glutes', 'Erector Spinae', 'Core'],
    commonMistakes: ['Rounding the back', 'Rotating hips', 'Not maintaining balance']
  },
  'Single-Leg Romanian Deadlift (Right)': {
    videoUrl: 'https://www.youtube.com/embed/43sDDqHqj0E',
    instructions: 'Stand on one leg, hinge at hip, lower weight while raising opposite leg. Keep back straight, core tight',
    targetMuscles: ['Hamstrings', 'Glutes', 'Erector Spinae', 'Core'],
    commonMistakes: ['Rounding the back', 'Rotating hips', 'Not maintaining balance']
  },
  'Floor Press': {
    videoUrl: 'https://www.youtube.com/embed/vcBig73ojpE',
    instructions: 'Lie on floor, press dumbbells up from chest. Floor limits range, increases tricep emphasis',
    targetMuscles: ['Chest', 'Triceps', 'Anterior Delts'],
    commonMistakes: ['Bouncing off floor', 'Flaring elbows too wide', 'Not controlling the negative']
  },
  'Dumbbell Floor Press': {
    videoUrl: 'https://www.youtube.com/embed/vcBig73ojpE',
    instructions: 'Lie on floor, press dumbbells up from chest. Floor limits range, increases tricep emphasis',
    targetMuscles: ['Chest', 'Triceps', 'Anterior Delts'],
    commonMistakes: ['Bouncing off floor', 'Flaring elbows too wide', 'Not controlling the negative']
  },
  'Pike Push-ups': {
    videoUrl: 'https://www.youtube.com/watch?v=PYL8jUzJr3A',
    instructions: 'Feet elevated, body in inverted V. Lower head between hands, press back up. Focus on shoulders',
    targetMuscles: ['Anterior Delts', 'Lateral Delts', 'Triceps', 'Upper Chest'],
    commonMistakes: ['Sagging hips', 'Not going deep enough', 'Hands too wide']
  },
  'Lateral Raise': {
    videoUrl: 'https://www.youtube.com/watch?v=KaZxDk88bYk',
    instructions: 'Stand tall with a dumbbell in each hand. Raise arms out to the sides until elbows reach shoulder height, then lower under control.',
    targetMuscles: ['Lateral Delts', 'Upper Traps', 'Supraspinatus'],
    commonMistakes: ['Shrugging the shoulders', 'Swinging the torso', 'Lifting higher than shoulder level']
  },
  'Hammer Curl': {
    videoUrl: 'https://www.youtube.com/embed/NyW2fT2gQhM',
    instructions: 'Hold dumbbells with neutral grip, keep elbows pinned to your sides, curl up without swinging, then lower slowly.',
    targetMuscles: ['Biceps', 'Brachialis', 'Brachioradialis', 'Forearms'],
    commonMistakes: ['Letting elbows drift forward', 'Using body English', 'Dropping the eccentric too fast']
  },
  'One Arm Dumbbell Row': {
    videoUrl: 'https://www.youtube.com/embed/9efgcAjQe7c',
    instructions: 'Bent over, support with one hand. Pull dumbbell to hip, squeeze shoulder blade. Control the negative',
    targetMuscles: ['Latissimus Dorsi', 'Rhomboids', 'Middle Traps', 'Biceps'],
    commonMistakes: ['Rotating torso', 'Using momentum', 'Not squeezing at top']
  },
  'One Arm Dumbbell Row (Left)': {
    videoUrl: 'https://www.youtube.com/embed/9efgcAjQe7c',
    instructions: 'Bent over, support with one hand. Pull dumbbell to hip, squeeze shoulder blade. Control the negative',
    targetMuscles: ['Latissimus Dorsi', 'Rhomboids', 'Middle Traps', 'Biceps'],
    commonMistakes: ['Rotating torso', 'Using momentum', 'Not squeezing at top']
  },
  'One Arm Dumbbell Row (Right)': {
    videoUrl: 'https://www.youtube.com/embed/9efgcAjQe7c',
    instructions: 'Bent over, support with one hand. Pull dumbbell to hip, squeeze shoulder blade. Control the negative',
    targetMuscles: ['Latissimus Dorsi', 'Rhomboids', 'Middle Traps', 'Biceps'],
    commonMistakes: ['Rotating torso', 'Using momentum', 'Not squeezing at top']
  },
  'Hanging Leg Raises': {
    videoUrl: 'https://www.youtube.com/embed/l5kKvjZv25A',
    instructions: 'Hang from bar, raise legs to 90 degrees (or knees to chest). Control the negative, avoid swinging',
    targetMuscles: ['Rectus Abdominis', 'Hip Flexors', 'Obliques'],
    commonMistakes: ['Swinging/momentum', 'Not controlling descent', 'Going too fast']
  },
  'Dumbbell Side Bend': {
    videoUrl: 'https://www.youtube.com/embed/8x7W3qJN7kE',
    instructions: 'Stand upright, hold dumbbell at side. Bend laterally to that side, return to start. Keep core engaged',
    targetMuscles: ['Obliques', 'Quadratus Lumborum'],
    commonMistakes: ['Leaning forward/back', 'Using too much weight', 'Not controlling movement']
  },
  'Dumbbell Side Bend (Left)': {
    videoUrl: 'https://www.youtube.com/embed/8x7W3qJN7kE',
    instructions: 'Stand upright, hold dumbbell at side. Bend laterally to that side, return to start. Keep core engaged',
    targetMuscles: ['Obliques', 'Quadratus Lumborum'],
    commonMistakes: ['Leaning forward/back', 'Using too much weight', 'Not controlling movement']
  },
  'Dumbbell Side Bend (Right)': {
    videoUrl: 'https://www.youtube.com/embed/8x7W3qJN7kE',
    instructions: 'Stand upright, hold dumbbell at side. Bend laterally to that side, return to start. Keep core engaged',
    targetMuscles: ['Obliques', 'Quadratus Lumborum'],
    commonMistakes: ['Leaning forward/back', 'Using too much weight', 'Not controlling movement']
  },
  'Rows': {
    videoUrl: 'https://www.youtube.com/embed/roCP6wCXPqo',
    instructions: 'Bent over row with dumbbells. Pull to lower chest/upper abs, squeeze shoulder blades together',
    targetMuscles: ['Latissimus Dorsi', 'Rhomboids', 'Middle Traps', 'Biceps'],
    commonMistakes: ['Rounded back', 'Using momentum', 'Not full range of motion']
  },
  'RDL': {
    videoUrl: 'https://www.youtube.com/watch?v=aa57T45iFSE',
    instructions: 'Hinge at hips, push hips back, lower dumbbells along legs. Feel stretch in hamstrings, return to start',
    targetMuscles: ['Hamstrings', 'Glutes', 'Erector Spinae'],
    commonMistakes: ['Bending knees too much', 'Rounding back', 'Not feeling hamstring stretch']
  },
  'Goblet Squat': {
    videoUrl: 'https://www.youtube.com/embed/MeIiIdhvXT4',
    instructions: 'Hold one dumbbell at chest height, sit down between your heels, keep your chest tall, then drive back up through mid-foot.',
    targetMuscles: ['Quadriceps', 'Glutes', 'Adductors', 'Core'],
    commonMistakes: ['Letting the chest collapse', 'Heels lifting off the floor', 'Cutting the depth short']
  },
  'Dumbbell Goblet Squat': {
    videoUrl: 'https://www.youtube.com/embed/MeIiIdhvXT4',
    instructions: 'Hold one dumbbell at chest height, sit down between your heels, keep your chest tall, then drive back up through mid-foot.',
    targetMuscles: ['Quadriceps', 'Glutes', 'Adductors', 'Core'],
    commonMistakes: ['Letting the chest collapse', 'Heels lifting off the floor', 'Cutting the depth short']
  },
  'Split Squat': {
    videoUrl: 'https://www.youtube.com/embed/2C-uNgKwPLE',
    instructions: 'Split stance, lower back knee toward ground. Front leg does majority of work. Keep torso upright',
    targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
    commonMistakes: ['Leaning forward', 'Knee caving', 'Not going deep enough']
  },
  'Glute Bridge': {
    videoUrl: 'https://youtu.be/kJRVzQ6sukU',
    instructions: 'Lie on your back with knees bent, brace your core, drive through your heels, and squeeze the glutes at the top before lowering slowly.',
    targetMuscles: ['Glutes', 'Hamstrings', 'Core'],
    commonMistakes: ['Hyperextending the lower back', 'Pushing through the toes', 'Rushing the top squeeze']
  },
  'Hamstring Curl (Yoga Ball)': {
    videoUrl: 'https://youtu.be/aTRCtlqMds0',
    instructions: 'Start in a bridge with heels on the yoga ball, curl the ball toward your hips without letting the hips drop, then extend back out slowly.',
    targetMuscles: ['Hamstrings', 'Glutes', 'Core'],
    commonMistakes: ['Dropping the hips', 'Yanking the ball in too fast', 'Losing tension at full extension']
  },
  'Standing Calf Raise': {
    videoUrl: 'https://www.youtube.com/embed/-M4-G8p8fmc',
    instructions: 'Stand tall, rise onto the balls of your feet as high as possible, pause briefly, then lower through a full stretch.',
    targetMuscles: ['Gastrocnemius', 'Soleus', 'Foot Stabilizers'],
    commonMistakes: ['Bouncing through reps', 'Shortening the range', 'Rolling the ankles outward']
  },
  'Ab Crunch (Yoga Ball)': {
    videoUrl: 'https://www.youtube.com/watch?v=UjJ7fWwK5K8',
    instructions: 'Sit on yoga ball, walk feet forward until lower back is on the ball. Crunch up, squeezing upper abs. Control the negative.',
    targetMuscles: ['Upper Rectus Abdominis', 'Obliques'],
    commonMistakes: ['Using neck to pull', 'Rolling ball too far forward', 'Rushing the rep']
  },
  'Leg Raises (Yoga Ball)': {
    videoUrl: 'https://www.youtube.com/watch?v=r1xWmZ8VvcM',
    instructions: 'Lie on back, squeeze yoga ball between ankles or calves. Raise legs toward ceiling with control, lower without letting ball touch floor. Focus on lower abs.',
    targetMuscles: ['Lower Rectus Abdominis', 'Hip Flexors', 'Transverse Abdominis'],
    commonMistakes: ['Swinging legs', 'Letting lower back arch', 'Dropping ball too fast']
  }
};

const normalizeDemoKey = (value: string): string => value.toLowerCase().trim();
const normalizeCompactDemoKey = (value: string): string =>
  value.toLowerCase().replace(/[-\s]/g, '').trim();

const EXACT_DEMO_LOOKUP = new Map(
  Object.entries(EXERCISE_DEMOS).map(([name, demo]) => [normalizeDemoKey(name), demo] as const)
);
const COMPACT_DEMO_LOOKUP = new Map(
  Object.entries(EXERCISE_DEMOS).map(([name, demo]) => [normalizeCompactDemoKey(name), demo] as const)
);

export function findExerciseDemo(name: string): ExerciseDemo | undefined {
  if (!name) return undefined;

  const exactMatch = EXACT_DEMO_LOOKUP.get(normalizeDemoKey(name));
  if (exactMatch) return exactMatch;

  const compactMatch = COMPACT_DEMO_LOOKUP.get(normalizeCompactDemoKey(name));
  if (compactMatch) return compactMatch;

  const nameKey = normalizeDemoKey(name);
  const partialMatch = Object.entries(EXERCISE_DEMOS).find(([demoName]) => {
    const demoKey = normalizeDemoKey(demoName);
    return demoKey.includes(nameKey) || nameKey.includes(demoKey);
  });
  return partialMatch?.[1];
}

/**
 * Get YouTube embed URL from regular YouTube URL
 */
export function getYouTubeEmbedUrl(url: string): string {
  if (url.includes('youtube.com/embed/')) return url;
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1].split('?')[0];
    return `https://www.youtube.com/embed/${id}`;
  }
  if (url.includes('youtube.com/watch?v=')) {
    const id = url.split('v=')[1].split('&')[0];
    return `https://www.youtube.com/embed/${id}`;
  }
  return url;
}
