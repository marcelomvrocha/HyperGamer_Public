export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="surface-card px-10 py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-lg text-slate-600 dark:text-slate-300">Loading...</p>
      </div>
    </div>
  );
}
