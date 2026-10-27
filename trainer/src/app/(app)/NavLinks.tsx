'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Learn' },
  { href: '/traps', label: 'Traps' },
  { href: '/profile', label: 'Profile' },
];

export default function NavLinks() {
  const path = usePathname();
  const active = (href: string) => (href === '/' ? path === '/' || path.startsWith('/openings') : path.startsWith(href));
  return (
    <nav className="nav" aria-label="Main">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className={active(l.href) ? 'nav__link nav__link--on' : 'nav__link'} aria-current={active(l.href) ? 'page' : undefined}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
