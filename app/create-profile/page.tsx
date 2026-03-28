'use client';

import { AvatarPicker } from '@/components/AvatarPicker';
import { apiPath } from '@/lib/app-paths';
import { getAvatarIdFromSeed } from '@/lib/avatars';
import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CreateProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState(() => getAvatarIdFromSeed('create-profile'));
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextPath = useMemo(() => {
    const value = searchParams.get('next');
    if (!value || !value.startsWith('/') || value.startsWith('/login') || value.startsWith('/create-profile')) {
      return '/';
    }
    return value;
  }, [searchParams]);

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch(apiPath('/api/auth/me'), { cache: 'no-store' });
        if (response.ok) {
          router.replace(nextPath);
        }
      } catch (err) {
        console.error('Failed to check session:', err);
      }
    }
    void checkSession();
  }, [nextPath, router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const trimmedDisplayName = displayName.trim();
      const normalizedEmail = email.trim().toLowerCase();

      if (trimmedDisplayName.length < 2) {
        setError('Display name must be at least 2 characters.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Password confirmation does not match.');
        return;
      }

      const response = await fetch(apiPath('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: trimmedDisplayName,
          email: normalizedEmail,
          avatar,
          password,
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error || 'Failed to create profile.');
        return;
      }

      router.replace(nextPath);
    } catch (err) {
      console.error('Create profile request failed:', err);
      setError('Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="surface-card p-4 sm:p-8 space-y-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Create Your Profile</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Build your account to save workouts, progress, achievements, and weekly review history.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Display name
              </label>
              <input
                id="displayName"
                type="text"
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="glass-input w-full px-4 py-2.5 rounded-lg"
                required
                minLength={2}
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input w-full px-4 py-2.5 rounded-lg"
                required
                placeholder="you@example.com"
              />
            </div>

            <AvatarPicker selectedAvatar={avatar} onSelect={setAvatar} />

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input w-full px-4 py-2.5 rounded-lg"
                required
                minLength={8}
                placeholder="Minimum 8 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="glass-input w-full px-4 py-2.5 rounded-lg"
                required
                minLength={8}
                placeholder="Re-enter your password"
              />
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating your profile...' : 'Create Profile'}
            </button>
          </form>

          <p className="text-sm text-gray-600 dark:text-gray-300">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <div className="surface-card p-4 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">What you get</h2>
          <ul className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <li>Track every workout set with reps, load, tempo, RIR, and techniques.</li>
            <li>Auto progression targets so your next session is clear and actionable.</li>
            <li>Achievements and XP that reflect consistency and execution quality.</li>
            <li>Weekly trend checks for body metrics and training decisions.</li>
            <li>Private account data scoped to your profile.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
