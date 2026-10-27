import Link from 'next/link';
import MiniBoard from '@/components/ui/MiniBoard';
import { Check, Target, Trap } from '@/components/ui/icons';
import { courses, isFeatured, trapCourses } from '@/lib/catalog';
import { getOpening } from '@/lib/content';
import { STEP_INFO, STEP_KINDS, lineSide, punishQuestions, stepDone } from '@/lib/course';
import { getProgress } from '@/lib/progress';
import { requirePageUser } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Traps' };

export default async function TrapsPage() {
  const user = await requirePageUser('/traps');
  const progress = await getProgress(user.id);
  const trapOps = trapCourses().map((o) => getOpening(o.id));
  const punishable = courses()
    .filter((o) => isFeatured(o.id) && o.section !== 'traps')
    .map((o) => ({ o, n: punishQuestions(getOpening(o.id), o.orientation).length }))
    .filter((x) => x.n > 0);

  return (
    <main className="page">
      <section className="traps-hero">
        <span className="traps-hero__icon">
          <Trap size={36} />
        </span>
        <div>
          <h1>Opening traps</h1>
          <p className="lead">
            Every trap from both chairs: spring it when your opponent walks in, and recognise it before you do. Each trap
            is a short chapter — learn it, then drill it until it’s automatic.
          </p>
        </div>
      </section>

      {trapOps.map((op) => {
        const byLine = progress.get(op.id) ?? new Map();
        return (
          <section key={op.id} className="section">
            <div className="section__head">
              <div>
                <h2 className="section__title">{op.name}</h2>
                <p className="muted">{op.tagline}</p>
              </div>
              <Link href={`/openings/${op.id}`} className="btn btn--secondary">
                Course page
              </Link>
            </div>
            <div className="grid-cards grid-cards--traps">
              {op.lines.map((line) => {
                const lp = byLine.get(line.slug);
                const side = lineSide(op, line);
                const end = line.plies[line.plies.length - 1];
                const nextStep = STEP_KINDS.find((k) => !stepDone(lp, k)) ?? 'drill';
                return (
                  <article key={line.slug} className="card trap-card">
                    <Link href={`/openings/${op.id}/${line.slug}/${nextStep}`} className="trap-card__board" aria-label={line.name}>
                      <MiniBoard fen={end.fen} flipped={side === 'black'} last={end} />
                    </Link>
                    <div className="trap-card__body">
                      <span className={`chip chip--side-${side}`}>
                        <img src={`/pieces/${side === 'white' ? 'w' : 'b'}P.svg`} alt="" />
                        As {side === 'white' ? 'White' : 'Black'}
                      </span>
                      <h3>{line.name}</h3>
                      <p className="muted small clamp-3" dangerouslySetInnerHTML={{ __html: line.note }} />
                      <div className="mini-path">
                        {STEP_KINDS.map((k) => (
                          <Link
                            key={k}
                            href={`/openings/${op.id}/${line.slug}/${k}`}
                            className={`mini-node${stepDone(lp, k) ? ' mini-node--done' : ''}`}
                            title={STEP_INFO[k].label}
                          >
                            {stepDone(lp, k) ? <Check size={14} /> : STEP_INFO[k].label[0]}
                          </Link>
                        ))}
                        <Link href={`/openings/${op.id}/${line.slug}/${nextStep}`} className="btn btn--primary btn--sm">
                          {STEP_INFO[nextStep].label}
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

      {punishable.length ? (
        <section className="section">
          <h2 className="section__title">Punish the blunder in your repertoire</h2>
          <p className="muted">The mistakes opponents make against your openings, with the refutation to find.</p>
          <div className="grid-cards">
            {punishable.map(({ o, n }) => (
              <Link key={o.id} href={`/openings/${o.id}/punish`} className="card way-card">
                <span className="way__icon way__icon--gold">
                  <Target size={22} />
                </span>
                <span>
                  <b>{o.name}</b>
                  <span className="muted small">{n} blunders to punish</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
