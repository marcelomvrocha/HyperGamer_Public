'use client';

import { useEffect, useMemo, useState } from 'react';
import { AvatarBadge } from '@/components/AvatarBadge';
import { apiPath } from '@/lib/app-paths';
import { getAvatarIdFromSeed } from '@/lib/avatars';

export function ProfilePicture() {
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch(apiPath('/api/auth/me'), { cache: 'no-store' });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || cancelled) return;
        setAvatar(result.user?.avatar || null);
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to load profile avatar:', error);
      }
    };

    const handleUserUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ user?: { avatar?: string | null } }>).detail;
      if (detail?.user) {
        setAvatar(detail.user.avatar || null);
      }
    };

    void load();
    window.addEventListener('hypergamer:user-updated', handleUserUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener('hypergamer:user-updated', handleUserUpdated);
    };
  }, []);

  const avatarId = useMemo(() => avatar || getAvatarIdFromSeed('header'), [avatar]);

  return (
    <div className="h-11 w-11 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 p-[2px]">
      <AvatarBadge
        avatar={avatarId}
        className="flex h-full w-full items-center justify-center rounded-full bg-slate-900 text-xl"
      />
    </div>
  );
}
