'use client';

import { useEffect } from 'react';
import { appPath } from '@/lib/app-paths';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="surface-card p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Something went wrong!
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error.message || 'An unexpected error occurred'}
        </p>
        <button
          onClick={reset}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Try again
        </button>
        <button
          onClick={() => {
            window.location.href = appPath('/');
          }}
          className="w-full mt-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}
