import Link from 'next/link';
import RecallSession from '@/components/session/RecallSession';
import { endOfDay, syncDeck } from '@/lib/cards';
import { getOpening } from '@/lib/content';
import { getSettings, learnerTimezone } from '@/lib/progress';
import { buildRuns } from '@/lib/recall';
import { withWrongMoves } from '@/lib/recallMoves';
import { deckFacts } from '@/lib/repertoireData';
import { requirePageUser } from '@/lib/session';
import { weakest } from '@/lib/stats';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Weakest positions' };

/** The stats page's ten weakest positions, asked the way Recall asks: each replayed in its line. */
export default async function WeakestPracticePage() {
  const user = await requirePageUser('/stats/practice');
  const [tz, settings] = await Promise.all([learnerTimezone(), getSettings(user.id), syncDeck(user.id)]);
  const weak = weakest(await deckFacts(user.id, endOfDay(tz)), 10);
  const runs = withWrongMoves(buildRuns(weak.map((w) => ({ openingId: w.openingId, key: w.key })), getOpening), getOpening);

  if (!runs.length) {
    return (
      <div className="empty-state">
        <h1>No weak spots</h1>
        <p className="muted">Everything you have answered is holding up. Come back after your next session.</p>
        <Link className="btn btn--primary" href="/stats">
          Back to stats
        </Link>
      </div>
    );
  }

  return (
    <RecallSession
      runs={runs}
      remaining={0}
      title="Weakest positions"
      closeHref="/stats"
      againHref="/stats/practice"
      sound={settings.sound}
      coordinates={settings.coordinates}
    />
  );
}
