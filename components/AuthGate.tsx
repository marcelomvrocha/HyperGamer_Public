'use client';

import { useEffect, useState } from 'react';
import { apiPath } from '@/lib/app-paths';
import { usePathname, useRouter } from 'next/navigation';

const PUBLIC_PATHS = new Set(['/login', '/create-profile']);

type Status = 'checking' | 'allowed';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    if (PUBLIC_PATHS.has(pathname)) {
      setStatus('allowed');
      return;
    }

    let cancelled = false;

    const run = async () => {
      setStatus('checking');
      try {
        const response = await fetch(apiPath('/api/auth/me'), { cache: 'no-store' });
        if (cancelled) return;

        if (response.ok) {
          setStatus('allowed');
          return;
        }

        router.replace(`/login?next=${encodeURIComponent(pathname || '/')}`);
      } catch (error) {
        if (cancelled) return;
        console.error('Auth check failed:', error);
        router.replace(`/login?next=${encodeURIComponent(pathname || '/')}`);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (status === 'checking') {
    return <div className="text-center py-8">Loading...</div>;
  }

  return <>{children}</>;
}
