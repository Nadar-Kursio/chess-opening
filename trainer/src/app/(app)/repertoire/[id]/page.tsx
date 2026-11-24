import Link from 'next/link';
import { notFound } from 'next/navigation';
import { endOfDay, syncDeck } from '@/lib/cards';
import { sideLabel } from '@/lib/catalog';
import { getOpening, hasOpening } from '@/lib/content';
import { sidesTaught } from '@/lib/course';
import { getProgress, learnerTimezone } from '@/lib/progress';
import { branchMap, clubShares, courseShape, subtreeTallies, walkSans } from '@/lib/repertoire';
import { clubOf, deckFacts, memoryByKey } from '@/lib/repertoireData';
import { requirePageUser } from '@/lib/session';
import type { Colour } from '@/lib/types';
import Explorer, { type ExplorerData } from './Explorer';
import '../../../repertoire.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/repertoire/[id]'>) {
  const { id } = await params;
  return { title: hasOpening(id) ? `${getOpening(id).name} repertoire` : 'Repertoire' };
}

export default async function RepertoirePage({ params, searchParams }: PageProps<'/repertoire/[id]'>) {
  const { id } = await params;
  if (!hasOpening(id)) notFound();
  const { side: sideParam, at } = await searchParams;
  const user = await requirePageUser(`/repertoire/${id}`);
  const op = getOpening(id);
  const sides = sidesTaught(op);
  const side: Colour = sides.includes(sideParam as Colour) ? (sideParam as Colour) : sides.includes(op.orientation) ? op.orientation : sides[0];

  const tz = await learnerTimezone();
  await syncDeck(user.id);
  const [facts, progress] = await Promise.all([deckFacts(user.id, endOfDay(tz), id), getProgress(user.id, id)]);

  const shape = courseShape(op, side);
  const memory = Object.fromEntries(Object.entries(memoryByKey(facts)).filter(([key]) => shape.nodes[key]?.ask));
  const club = clubOf(id);
  const shares = clubShares(shape, op, club?.index ?? null);
  const nodes: ExplorerData['nodes'] = Object.fromEntries(
    Object.entries(shape.nodes).map(([key, n]) => [
      key,
      {
        ...n,
        // The screen names one lesson per move and counts the rest.
        moves: n.moves.map(({ teach, ...m }) => ({ ...m, teach: teach.slice(0, 1), more: teach.length - 1, club: shares[`${key}>${m.next}`] })),
      },
    ]),
  );
  const lines = progress.get(id) ?? new Map();
  const sans = typeof at === 'string' && at ? at.split('.') : [];

  const data: ExplorerData = {
    id,
    name: op.name,
    side: shape.side,
    root: shape.root,
    nodes,
    memory,
    tallies: subtreeTallies(shape, memory),
    groups: branchMap(shape, op),
    initial: walkSans(shape, sans),
    club: club
      ? { source: club.source.source ?? 'club games', games: club.source.games ?? null, elo: club.source.elo ?? null }
      : op.sidelines
        ? { source: op.sidelines.source, games: op.sidelines.games, elo: op.sidelines.elo, partial: true }
        : null,
    learned: [...lines.values()].filter((l) => l.learned_at).map((l) => l.line_slug),
  };

  return (
    <main className="page rep-page">
      <Link href="/repertoire" className="back-link">
        ← All repertoires
      </Link>
      <header className="rep-head">
        <div>
          <span className="eyebrow">Repertoire</span>
          <h1>{op.name}</h1>
        </div>
        {sides.length > 1 ? (
          <nav className="rep-sides" aria-label="Which side">
            {sides.map((s) => (
              <Link key={s} href={`/repertoire/${id}?side=${s}`} className="rep-sides__link" aria-current={s === side ? 'page' : undefined}>
                <img src={`/pieces/${s === 'white' ? 'w' : 'b'}P.svg`} alt="" />
                {s === 'white' ? 'As White' : 'As Black'}
              </Link>
            ))}
          </nav>
        ) : (
          <span className={`chip chip--side-${side}`}>
            <img src={`/pieces/${side === 'white' ? 'w' : 'b'}P.svg`} alt="" />
            {sideLabel(side)}
          </span>
        )}
      </header>
      <Explorer key={side} data={data} />
    </main>
  );
}
