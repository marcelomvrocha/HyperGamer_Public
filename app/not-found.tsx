import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="surface-card p-6 sm:p-8 text-center max-w-md w-full">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          404
        </h2>
        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-2">
          Page Not Found
        </p>
        <p className="text-gray-500 dark:text-gray-500 mb-6">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}
