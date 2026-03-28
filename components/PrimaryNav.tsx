'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = {
  href: string;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Today' },
  { href: '/progress', label: 'Progress' },
  { href: '/achievements', label: 'Achievements' },
  { href: '/weekly', label: 'Weekly Review' },
];

function isActivePath(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}

export function PrimaryNav() {
  const pathname = usePathname();

  return (
    <>
      {NAV_ITEMS.map(item => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link${active ? ' nav-link-active' : ''}`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
