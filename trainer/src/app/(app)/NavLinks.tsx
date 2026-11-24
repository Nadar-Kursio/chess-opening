'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Board, Book, Brain, Swords } from '@/components/ui/icons';
import '../nav.css';

const LINKS = [
  { href: '/', label: 'Learn', Icon: Book },
  { href: '/play', label: 'Play', Icon: Swords },
  { href: '/recall', label: 'Recall', Icon: Brain },
  { href: '/games', label: 'Games', Icon: Board },
];

function useActive() {
  const path = usePathname();
  return (href: string) => (href === '/' ? path === '/' || path.startsWith('/openings') : path.startsWith(href));
}

function DueBadge({ due }: { due: number }) {
  return (
    <span className="nav__badge" aria-label={`${due} due`}>
      {due > 99 ? '99+' : due}
    </span>
  );
}

/** `due`: Recall moves due today, shown on its link. */
export default function NavLinks({ due }: { due: number }) {
  const active = useActive();
  return (
    <nav className="nav" aria-label="Main">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className={active(l.href) ? 'nav__link nav__link--on' : 'nav__link'} aria-current={active(l.href) ? 'page' : undefined}>
          {l.label}
          {l.href === '/recall' && due ? <DueBadge due={due} /> : null}
        </Link>
      ))}
    </nav>
  );
}

/** The same sections as a bar along the bottom of a phone, where the header has no room for them. */
export function TabBar({ due }: { due: number }) {
  const active = useActive();
  return (
    <nav className="tabbar" aria-label="Main">
      {LINKS.map(({ href, label, Icon }) => (
        <Link key={href} href={href} className={active(href) ? 'tabbar__link tabbar__link--on' : 'tabbar__link'} aria-current={active(href) ? 'page' : undefined}>
          <span className="tabbar__icon">
            <Icon size={24} />
            {href === '/recall' && due ? <DueBadge due={due} /> : null}
          </span>
          {label}
        </Link>
      ))}
    </nav>
  );
}
