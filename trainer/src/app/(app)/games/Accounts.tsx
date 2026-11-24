'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Retry } from '@/components/ui/icons';
import type { Site } from '@/lib/games';

/* Linking a Lichess or Chess.com username and importing from it. The server does the fetching; this
   only says what happened, in words a player can act on. */

export interface AccountView {
  site: Site;
  name: string;
  username: string | null;
  games: number;
  /** "12 minutes ago", worked out on the server so the page reads the same before and after hydration. */
  importedAgo: string | null;
  /** Minutes until the site can be imported from again; 0 when it can now. */
  waitMinutes: number;
}

type Status = { site: Site; tone: 'busy' | 'good' | 'bad'; text: string } | null;

const PLACEHOLDER: Record<Site, string> = { lichess: 'Your Lichess username', chesscom: 'Your Chess.com username' };

export default function Accounts({ accounts }: { accounts: AccountView[] }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [unlinking, setUnlinking] = useState<Site | null>(null);
  const busy = status?.tone === 'busy';

  const run = async (site: Site, username: string, siteName: string) => {
    setStatus({ site, tone: 'busy', text: `Reading your games from ${siteName}…` });
    try {
      const res = await fetch('/api/games/import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ site, username }),
        redirect: 'manual',
      });
      const body = (await res.json().catch(() => null)) as
        | { error?: string; added?: number; fetched?: number; recalled?: number; username?: string }
        | null;
      if (!res.ok || !body || body.error) {
        setStatus({ site, tone: 'bad', text: body?.error ?? (res.type === 'opaqueredirect' ? 'Your session ended. Sign in again.' : 'That didn’t work. Try again in a minute.') });
        return;
      }
      const added = body.added ?? 0;
      const parts = [
        added ? `${added} new game${added === 1 ? '' : 's'} from ${body.username}` : `No new games since your last import`,
        body.recalled ? `${body.recalled} position${body.recalled === 1 ? '' : 's'} you forgot ${body.recalled === 1 ? 'is' : 'are'} due in Recall today` : '',
      ].filter(Boolean);
      setStatus({ site, tone: 'good', text: `${parts.join('. ')}.` });
      setNames((n) => ({ ...n, [site]: '' }));
      router.refresh();
    } catch {
      setStatus({ site, tone: 'bad', text: 'Couldn’t reach ChessLab. Check your connection and try again.' });
    }
  };

  const submit = (a: AccountView) => (e: FormEvent) => {
    e.preventDefault();
    const name = (names[a.site] ?? '').trim();
    if (name) void run(a.site, name, a.name);
  };

  const remove = async (a: AccountView) => {
    setUnlinking(null);
    setStatus({ site: a.site, tone: 'busy', text: `Unlinking ${a.name}…` });
    const res = await fetch(`/api/games/account?site=${a.site}`, { method: 'DELETE', redirect: 'manual' }).catch(() => null);
    setStatus(res?.ok ? { site: a.site, tone: 'good', text: `Unlinked. Games from ${a.name} are gone from your report.` } : { site: a.site, tone: 'bad', text: 'Couldn’t unlink just now. Try again.' });
    if (res?.ok) router.refresh();
  };

  return (
    <div className="accounts">
      {accounts.map((a) => (
        <div key={a.site} className={`account account--${a.site}`}>
          <span className="account__site">{a.name}</span>
          {a.username ? (
            <div className="account__linked">
              <div className="account__who">
                <b>{a.username}</b>
                <span className="muted small">
                  {a.games} game{a.games === 1 ? '' : 's'}
                  {a.importedAgo ? ` · imported ${a.importedAgo}` : ''}
                </span>
              </div>
              <div className="account__actions">
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  disabled={busy || a.waitMinutes > 0}
                  onClick={() => void run(a.site, a.username!, a.name)}
                  title={a.waitMinutes ? `Imports from ${a.name} open again in ${a.waitMinutes} min` : undefined}
                >
                  <Retry size={16} /> {a.waitMinutes ? `Again in ${a.waitMinutes} min` : 'Import new games'}
                </button>
                {unlinking === a.site ? (
                  <span className="account__confirm">
                    <button type="button" className="btn btn--danger btn--sm" onClick={() => void remove(a)}>
                      Unlink
                    </button>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => setUnlinking(null)}>
                      Keep
                    </button>
                  </span>
                ) : (
                  <button type="button" className="link-btn" disabled={busy} onClick={() => setUnlinking(a.site)}>
                    Unlink
                  </button>
                )}
              </div>
            </div>
          ) : (
            <form className="account__form" onSubmit={submit(a)}>
              <input
                className="account__input"
                name={`${a.site}-username`}
                aria-label={PLACEHOLDER[a.site]}
                placeholder={PLACEHOLDER[a.site]}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={200}
                value={names[a.site] ?? ''}
                onChange={(e) => setNames((n) => ({ ...n, [a.site]: e.target.value }))}
              />
              <button type="submit" className="btn btn--primary btn--sm" disabled={busy || !(names[a.site] ?? '').trim()}>
                Import games
              </button>
            </form>
          )}
          {status?.site === a.site ? (
            <p className={`account__status account__status--${status.tone}`} role={status.tone === 'bad' ? 'alert' : 'status'}>
              {status.tone === 'busy' ? <span className="account__spinner" aria-hidden="true" /> : null}
              {status.text}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
