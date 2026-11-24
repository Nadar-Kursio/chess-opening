import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { BoardArrow } from '@/components/Board';
import { Play } from '@/components/ui/icons';
import { getOpening } from '@/lib/content';
import { allOpenings, getGame, learnedLines } from '@/lib/gameImport';
import { SITES } from '@/lib/gameSources';
import { SITE_NAME, depthOf, deviationOf, exitKey, forgot, matchGame, moveNum, resolveSan, walkPlies, type Site } from '@/lib/games';
import { getSettings, learnerTimezone } from '@/lib/progress';
import { isCard, treeFor } from '@/lib/recall';
import { requirePageUser } from '@/lib/session';
import GameBoard from '../../GameBoard';
import { RESULT_LABEL, ResultChip, movesText, sideName, teachLink } from '../../parts';
import '../../../../games.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your game' };

export default async function GamePage({ params }: PageProps<'/games/[site]/[id]'>) {
  const { site, id } = await params;
  if (!SITES.includes(site as Site)) notFound();
  const user = await requirePageUser(`/games/${site}/${id}`);
  const [game, { learned, studied }, settings, tz] = await Promise.all([
    getGame(user.id, site as Site, id),
    learnedLines(user.id),
    getSettings(user.id),
    learnerTimezone(),
  ]);
  if (!game) notFound();

  const walk = matchGame(allOpenings(), studied, game.colour, game.moves, game.positions);
  const op = walk ? getOpening(walk.openingId) : null;
  const deviation = walk && op ? deviationOf(op, walk, learned.get(op.id)) : null;
  const when = game.playedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: tz });
  const depth = walk ? depthOf(walk) : 0;
  const siteLink = game.site === 'lichess' ? `${game.url}#${depth}` : game.url;

  const head = (
    <header className="game-head">
      <ResultChip result={game.result} />
      <div className="game-head__titles">
        <h1>
          {RESULT_LABEL[game.result]} against {game.opponent}
          {game.opponentRating ? <span className="muted"> ({game.opponentRating})</span> : null}
        </h1>
        <span className="muted small">
          {when} · {game.speed} · you had {sideName(game.colour)} · {SITE_NAME[game.site]}
        </span>
      </div>
    </header>
  );

  if (!walk || !op) {
    return (
      <main className="page games">
        <Link href="/games" className="back-link">
          ← Your games
        </Link>
        {head}
        <section className="card game-none">
          <h2>No course follows this game</h2>
          <p className="muted">
            {game.openingName ? `${SITE_NAME[game.site]} calls it ${game.openingName}. ` : ''}ChessLab doesn’t teach it yet, so there’s no
            book to compare it with.
          </p>
          <a className="btn btn--secondary" href={game.url} target="_blank" rel="noreferrer">
            Open on {SITE_NAME[game.site]}
          </a>
        </section>
      </main>
    );
  }

  const isStudied = studied.has(op.id);
  const tree = treeFor(op, walk.side);
  const exit = tree.nodes[exitKey(walk)];
  const plies = walkPlies(op, walk).map(({ san, fen, from, to, num, turn, check, ev, mate, mark }) => ({
    san,
    fen,
    from,
    to,
    num,
    turn,
    check,
    ev,
    mate,
    mark,
  }));
  const arrows: BoardArrow[] = [];
  if (deviation) {
    if (deviation.played.arrow) arrows.push({ ...deviation.played.arrow, kind: 'bad' });
    arrows.push({ ...deviation.course[0].arrow, kind: 'good' });
  } else if (walk.outcome === 'them' && walk.played) {
    const a = resolveSan(exit, walk.played);
    if (a) arrows.push({ ...a, kind: 'bad' });
  }
  const met = walk.met;
  const sideline = met?.kind === 'sideline' ? op.sidelines?.items.find((s) => s.slug === met.slug) : undefined;
  const learn = deviation ? teachLink(op.id, deviation, op.lines) : null;
  const canPractise = !!deviation?.learnedAt && isCard(op, deviation.key);
  const cover = walk.cover ? getOpening(walk.cover) : null;

  return (
    <main className="page games">
      <Link href="/games" className="back-link">
        ← Your games
      </Link>
      {head}
      <div className="game-view">
        <div className="game-view__board">
          <GameBoard
            plies={plies}
            orientation={game.colour === 'white' ? 'w' : 'b'}
            arrows={arrows}
            engine={!!op.engineView}
            coordinates={settings.coordinates}
          />
        </div>
        <div className="game-view__side">
          <Link href={`/openings/${op.id}`} className="chip game-view__course">
            <img src={`/pieces/${walk.side === 'white' ? 'w' : 'b'}P.svg`} alt="" />
            {op.name}
            {isStudied ? '' : ' · not started'}
          </Link>

          {deviation ? (
            <section className="card game-exit game-exit--you">
              <span className="eyebrow">You left the course</span>
              <h2>
                You played <span className="move move--bad">{deviation.played.num}</span>
              </h2>
              <p>
                The course plays <b className="move move--good">{deviation.course.map((c) => c.num).join(' or ')}</b> here, after{' '}
                {movesText(depth)} in book.
              </p>
              {deviation.verdict ? (
                <p className={`forgot__verdict forgot__verdict--${deviation.verdict.sev}`}>
                  <b>{deviation.verdict.title}</b> {deviation.verdict.text}
                </p>
              ) : null}
              {deviation.authored ? <p className="muted" dangerouslySetInnerHTML={{ __html: deviation.authored.why }} /> : null}
              <p className="muted small">
                {forgot(deviation, game.playedAt)
                  ? 'You had learned this move before the game. It’s in your Recall deck now.'
                  : deviation.learnedAt
                    ? 'You learned this move after the game.'
                    : isStudied
                      ? `You haven’t learned the ${learn?.label.endsWith('sideline') ? 'sideline' : 'chapter'} that teaches it yet.`
                      : 'Start the course to learn it.'}
              </p>
              <div className="game-exit__actions">
                {canPractise ? (
                  <Link
                    href={`/games/practice?course=${op.id}&key=${encodeURIComponent(deviation.key)}`}
                    className="btn btn--primary"
                  >
                    <Play size={18} /> Practise this position
                  </Link>
                ) : learn ? (
                  <Link href={learn.href} className="btn btn--primary" title={learn.name}>
                    {learn.label}
                  </Link>
                ) : null}
              </div>
            </section>
          ) : walk.outcome === 'them' ? (
            <section className="card game-exit game-exit--them">
              <span className="eyebrow">Your opponent left the course</span>
              <h2>
                They played <span className="move">{moveNum(depth, walk.played!)}</span>
              </h2>
              <p>
                You were in book for {movesText(depth)}. The {op.name} course doesn’t cover {moveNum(depth, walk.played!)} yet
                {cover ? `, but the ${cover.name} course does` : ''}.
              </p>
              {cover ? (
                <Link href={`/openings/${cover.id}`} className="btn btn--secondary">
                  See the {cover.name}
                </Link>
              ) : null}
            </section>
          ) : (
            <section className="card game-exit game-exit--book">
              <span className="eyebrow">In book all the way</span>
              <h2>{walk.outcome === 'over' ? 'The game ended inside the course' : 'You played the course to its last move'}</h2>
              <p>
                {movesText(depth)} of prep, and you knew every one of yours.
                {walk.outcome === 'end' ? ' From here the game was your own.' : ''}
              </p>
            </section>
          )}

          {walk.detours.length ? (
            <p className="muted small game-view__detour">
              The game left the course at {moveNum(walk.detours[0].from, game.moves[walk.detours[0].from])} and came back to it at{' '}
              {moveNum(walk.detours[0].to, game.moves[walk.detours[0].to])} by another move order, so it’s compared from there.
            </p>
          ) : null}

          {met && met.kind !== 'uncovered' ? (
            <section className="card game-met">
              <p>
                At <b className="move">{met.num}</b> your opponent left the chapters
                {met.kind === 'sideline' ? ' for a sideline the course teaches' : ' for a move the course has an answer to'}
                {met.name ? ` (${met.name})` : ''}.
              </p>
              {sideline && learn?.href !== `/openings/${op.id}/${sideline.slug}/learn` ? (
                <Link href={`/openings/${op.id}/${sideline.slug}/learn`} className="btn btn--secondary btn--sm">
                  Learn the sideline
                </Link>
              ) : null}
            </section>
          ) : null}

          <section className="card game-moves" aria-label="The moves">
            <h3>The moves</h3>
            <ol className="game-moves__list">
              {game.moves.map((san, i) => (
                <li
                  key={i}
                  className={`game-moves__move${i < depth ? ' game-moves__move--book' : ''}${i === depth && walk.played ? ` game-moves__move--exit game-moves__move--${walk.outcome}` : ''}`}
                >
                  {i % 2 === 0 ? <span className="game-moves__num">{i / 2 + 1}.</span> : null}
                  {san}
                </li>
              ))}
            </ol>
            <a className="link-btn" href={siteLink} target="_blank" rel="noreferrer">
              Open on {SITE_NAME[game.site]}
            </a>
          </section>
        </div>
      </div>
    </main>
  );
}

