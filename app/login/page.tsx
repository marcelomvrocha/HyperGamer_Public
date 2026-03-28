'use client';

import { AvatarPicker } from '@/components/AvatarPicker';
import { apiPath } from '@/lib/app-paths';
import { getAvatarIdFromSeed } from '@/lib/avatars';
import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type AuthMode = 'login' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const modeFromQuery = useMemo<AuthMode>(() => {
    return searchParams.get('mode') === 'register' ? 'register' : 'login';
  }, [searchParams]);

  const [mode, setMode] = useState<AuthMode>(modeFromQuery);
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState(() => getAvatarIdFromSeed('register'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextPath = useMemo(() => {
    const value = searchParams.get('next');
    if (
      !value ||
      !value.startsWith('/') ||
      value.startsWith('/login') ||
      value.startsWith('/create-profile')
    ) {
      return '/';
    }
    return value;
  }, [searchParams]);

  useEffect(() => {
    setMode(modeFromQuery);
    setError(null);
  }, [modeFromQuery]);

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

      if (mode === 'register') {
        if (trimmedDisplayName.length < 2) {
          setError('Display name must be at least 2 characters.');
          return;
        }

        if (password !== confirmPassword) {
          setError('Password confirmation does not match.');
          return;
        }
      }

      const endpoint = mode === 'register' ? apiPath('/api/auth/register') : apiPath('/api/auth/login');
      const payload =
        mode === 'register'
          ? { displayName: trimmedDisplayName, email: normalizedEmail, avatar, password }
          : { email: normalizedEmail, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(result.error || 'Authentication failed.');
        return;
      }

      router.replace(nextPath);
    } catch (err) {
      console.error('Auth request failed:', err);
      setError('Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-6 sm:py-8">
      <div className="surface-card p-4 sm:p-6 space-y-5">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          {mode === 'register' ? 'Create Profile' : 'Sign In'}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {mode === 'register'
            ? 'Create your account to store your own workouts and progress.'
            : 'Sign in to load your personal workout data.'}
        </p>
        {mode === 'login' && (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            New here?{' '}
            <Link href="/create-profile" className="text-blue-600 dark:text-blue-400 hover:underline">
              Create Profile
            </Link>
          </p>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Display name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="glass-input w-full px-4 py-2.5 rounded-lg"
                required
                minLength={2}
              />
            </div>
          )}

          {mode === 'register' && (
            <AvatarPicker selectedAvatar={avatar} onSelect={setAvatar} />
          )}

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
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input w-full px-4 py-2.5 rounded-lg"
              required
              minLength={8}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Minimum 8 characters.</p>
          </div>

          {mode === 'register' && (
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
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Please wait...' : mode === 'register' ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'register' ? 'login' : 'register');
            setError(null);
            setPassword('');
            setConfirmPassword('');
            setAvatar(getAvatarIdFromSeed('register'));
          }}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {mode === 'register' ? 'Already have an account? Sign in.' : 'Need an account? Create one.'}
        </button>
      </div>
    </div>
  );
}
