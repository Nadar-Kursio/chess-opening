import { signOut } from '@/app/auth-actions';
import { Flame } from '@/components/ui/icons';
import { courseCard, courses } from '@/lib/catalog';
import { getProgress, getPulse, getSettings, getTotals } from '@/lib/progress';
import { requirePageUser } from '@/lib/session';
import SettingsForm from './SettingsForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Profile' };

export default async function ProfilePage() {
  const user = await requirePageUser('/profile');
  const [totals, pulse, settings, progress] = await Promise.all([
    getTotals(user.id),
    getPulse(user.id),
    getSettings(user.id),
    getProgress(user.id),
  ]);
  const started = courses()
    .map((o) => courseCard(o, progress.get(o.id)))
    .filter((c) => c.progress.done > 0);
  const accuracy = totals.moves + totals.mistakes ? Math.round((totals.moves / (totals.moves + totals.mistakes)) * 100) : null;

  return (
    <main className="page page--narrow">
      <section className="card profile-head">
        <span className="avatar avatar--big">{(user.name || user.email).slice(0, 1).toUpperCase()}</span>
        <div>
          <h1>{user.name}</h1>
          <p className="muted">{user.email}</p>
        </div>
        <form action={signOut}>
          <button className="btn btn--ghost" type="submit">
            Sign out
          </button>
        </form>
      </section>

      <section className="stats">
        <div className="card stat">
          <span className="stat__value gold">
            <Flame size={22} /> {pulse.streak}
          </span>
          <span className="muted small">day streak</span>
        </div>
        <div className="card stat">
          <span className="stat__value">{totals.moves}</span>
          <span className="muted small">moves played</span>
        </div>
        <div className="card stat">
          <span className="stat__value">{accuracy === null ? '—' : `${accuracy}%`}</span>
          <span className="muted small">first-try accuracy</span>
        </div>
        <div className="card stat">
          <span className="stat__value">{totals.days}</span>
          <span className="muted small">days practised</span>
        </div>
      </section>

      {started.length ? (
        <section className="card">
          <h2>Courses</h2>
          <ul className="progress-list">
            {started.map((c) => (
              <li key={c.summary.id}>
                <span>{c.summary.name}</span>
                <div className="bar bar--thin">
                  <span style={{ width: `${c.progress.pct}%` }} />
                </div>
                <b>{c.progress.pct}%</b>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="card">
        <h2>Settings</h2>
        <SettingsForm initial={settings} />
      </section>
    </main>
  );
}
