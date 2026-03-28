'use client';

import { useParams } from 'next/navigation';
import { EXERCISE_DEMOS, getYouTubeEmbedUrl } from '@/lib/exercise-demos';

export default function ExerciseDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const exerciseName = decodeURIComponent(id).replace(/-/g, ' ');
  
  // Find exercise demo (try exact match first, then partial)
  const demo = EXERCISE_DEMOS[exerciseName] || 
    Object.entries(EXERCISE_DEMOS).find(([name]) => 
      name.toLowerCase().includes(exerciseName.toLowerCase()) ||
      exerciseName.toLowerCase().includes(name.toLowerCase())
    )?.[1];

  if (!demo) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">{exerciseName}</h1>
        <p className="text-gray-700 dark:text-gray-300">Exercise demonstration not available yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{exerciseName}</h1>

      {/* Video */}
      {demo.videoUrl ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Form Demonstration</h2>
          <div className="aspect-video w-full max-w-3xl mx-auto bg-black rounded-lg overflow-hidden">
            <iframe
              src={getYouTubeEmbedUrl(demo.videoUrl)}
              title={`${exerciseName} demonstration`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
              loading="lazy"
              frameBorder="0"
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 text-center">
            Watch the form demonstration above before performing this exercise
          </p>
        </div>
      ) : (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            Video demonstration coming soon for this exercise.
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Instructions</h2>
        <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{demo.instructions}</p>
      </div>

      {/* Target Muscles */}
      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 sm:p-6">
        <h2 className="text-xl font-semibold mb-4 text-blue-900 dark:text-blue-100">Target Muscles</h2>
        <div className="flex flex-wrap gap-2">
          {demo.targetMuscles.map((muscle, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 rounded-full text-sm font-medium"
            >
              {muscle}
            </span>
          ))}
        </div>
      </div>

      {/* Common Mistakes */}
      {demo.commonMistakes && demo.commonMistakes.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 sm:p-6">
          <h2 className="text-xl font-semibold mb-4 text-yellow-900 dark:text-yellow-100">Common Mistakes to Avoid</h2>
          <ul className="list-disc list-inside space-y-2 text-yellow-800 dark:text-yellow-200">
            {demo.commonMistakes.map((mistake, i) => (
              <li key={i}>{mistake}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="pt-4">
        <a
          href="/"
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
        >
          ← Back to Workout
        </a>
      </div>
    </div>
  );
}
