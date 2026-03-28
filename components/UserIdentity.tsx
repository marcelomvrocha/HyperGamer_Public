'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AvatarBadge } from '@/components/AvatarBadge';
import { apiPath } from '@/lib/app-paths';
import { getAvatarIdFromSeed } from '@/lib/avatars';

type PublicUser = {
  id: string;
  email: string;
  displayName: string;
  avatar: string;
};

export function UserIdentity() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch(apiPath('/api/auth/me'), { cache: 'no-store' });
        if (!response.ok) {
          if (!cancelled) {
            setUser(null);
            setCheckedAuth(true);
          }
          return;
        }
        const result = await response.json().catch(() => ({}));
        if (cancelled) return;
        setUser(result.user ?? null);
        setCheckedAuth(true);
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to load user identity:', error);
        setUser(null);
        setCheckedAuth(true);
      }
    };

    const handleUserUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ user?: PublicUser }>).detail;
      setUser(detail?.user ?? null);
      setCheckedAuth(true);
    };

    void load();
    window.addEventListener('hypergamer:user-updated', handleUserUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener('hypergamer:user-updated', handleUserUpdated);
    };
  }, []);

  const avatarId = useMemo(() => {
    if (!user) return getAvatarIdFromSeed('guest');
    return user.avatar || getAvatarIdFromSeed(user.id);
  }, [user]);

  if (!checkedAuth) {
    return (
      <div
        aria-hidden="true"
        className="h-10 w-[92px] rounded-full border border-slate-200/70 bg-white/60 dark:border-slate-700 dark:bg-slate-900/60"
      />
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center rounded-full border border-slate-200/70 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-600"
      >
        Sign in
      </Link>
    );
  }

  return (
    <Link
      href="/profile"
      className="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-2 py-1.5 text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-600"
      aria-label="Open profile"
    >
      <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 text-xs font-semibold text-white">
        <AvatarBadge
          avatar={avatarId}
          className="flex h-full w-full items-center justify-center rounded-full bg-slate-900 text-base"
        />
      </span>
      <span className="hidden max-w-[120px] truncate text-sm font-medium sm:inline">{user.displayName}</span>
    </Link>
  );
}
