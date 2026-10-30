'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Learn' },
  { href: '/recall', label: 'Recall' },
  { href: '/profile', label: 'Profile' },
];

/** `due`: Recall moves due today, shown on its link. */
export default function NavLinks({ due }: { due: number }) {
  const path = usePathname();
  const active = (href: string) => (href === '/' ? path === '/' || path.startsWith('/openings') : path.startsWith(href));
  return (
    <nav className="nav" aria-label="Main">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className={active(l.href) ? 'nav__link nav__link--on' : 'nav__link'} aria-current={active(l.href) ? 'page' : undefined}>
          {l.label}
          {l.href === '/recall' && due ? <span className="nav__badge" aria-label={`${due} due`}>{due > 99 ? '99+' : due}</span> : null}
        </Link>
      ))}
    </nav>
  );
}
