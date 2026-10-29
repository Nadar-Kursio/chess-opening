import Link from 'next/link';
import { Flame } from '@/components/ui/icons';
import { countDue, endOfDay } from '@/lib/cards';
import { getPulse, learnerTimezone } from '@/lib/progress';
import { requirePageUser } from '@/lib/session';
import NavLinks from './NavLinks';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser('/');
  const tz = await learnerTimezone();
  const [pulse, due] = await Promise.all([getPulse(user.id), countDue(user.id, endOfDay(tz))]);
  const goalShare = Math.min(1, pulse.today / pulse.goal);
  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__inner">
          <Link href="/" className="brand">
            <span className="brand__mark" aria-hidden="true">
              <img src="/pieces/wN.svg" alt="" />
            </span>
            <span className="brand__name">ChessLab</span>
          </Link>
          <NavLinks due={due} />
          <div className="topbar__stats">
            <span className={`stat-chip stat-chip--streak${pulse.streak ? '' : ' stat-chip--cold'}`} title="Day streak">
              <Flame size={18} />
              {pulse.streak}
            </span>
            <span className="stat-chip stat-chip--goal" title={`Today: ${pulse.today} of ${pulse.goal} moves`}>
              <Ring share={goalShare} />
              {pulse.today}/{pulse.goal}
            </span>
            <Link href="/profile" className="avatar" aria-label="Your profile">
              {(user.name || user.email).slice(0, 1).toUpperCase()}
            </Link>
          </div>
        </div>
      </header>
      <div className="app__main">{children}</div>
    </div>
  );
}

function Ring({ share }: { share: number }) {
  const c = 2 * Math.PI * 8;
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" className="ring" aria-hidden="true">
      <circle cx="10" cy="10" r="8" className="ring__track" />
      <circle cx="10" cy="10" r="8" className="ring__fill" strokeDasharray={`${share * c} ${c}`} transform="rotate(-90 10 10)" />
    </svg>
  );
}
