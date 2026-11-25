import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sideLabel } from '@/lib/catalog';
import { getOpening, hasOpening } from '@/lib/content';
import { sidesTaught } from '@/lib/course';
import { requirePageUser } from '@/lib/session';
import type { Colour } from '@/lib/types';
import Explorer from './Explorer';
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
  await requirePageUser(`/repertoire/${id}`);
  const op = getOpening(id);
  const sides = sidesTaught(op);
  const side: Colour = sides.includes(sideParam as Colour) ? (sideParam as Colour) : sides.includes(op.orientation) ? op.orientation : sides[0];

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
      <Explorer key={side} src={`/api/repertoire/${id}?side=${side}${typeof at === 'string' && at ? `&at=${encodeURIComponent(at)}` : ''}`} />
    </main>
  );
}
