import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { BoardArrow } from '@/components/Board';
import Burst from '@/components/fun/Burst';
import type { BoardStep } from '@/components/session/SessionBoard';
import { Play, Trap } from '@/components/ui/icons';
import { getClub, getOpening } from '@/lib/content';
import { evalText } from '@/lib/engineView';
import { allOpenings, getGame, learnedLines } from '@/lib/gameImport';
import { prepReport, type PracticeLink, type ScoredMove } from '@/lib/gamePrep';
import { SITES } from '@/lib/gameSources';
import { baitsOf, trapsInGame, type TrapOutcome } from '@/lib/gameTraps';
import { SITE_NAME, depthOf, deviationOf, forgot, gameFacts, gameKeys, matchGame, moveNum, walkPlies, type Site, type Walk } from '@/lib/games';
import { trapTitle } from '@/lib/traps';
import { gameXp } from '@/lib/xp';
import { getSettings, learnerTimezone } from '@/lib/progress';
import { isCard } from '@/lib/recall';
import { requirePageUser } from '@/lib/session';
import type { Severity } from '@/lib/types';
import GameBoard from '../../GameBoard';
import { PrepBadge, RESULT_LABEL, ResultChip, plural, sideName } from '../../parts';
import '../../../../games.css';
import '../../../../trapdex.css';
import '../../../../prep.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'How your opening went' };

const TRAP_WORDS: Record<TrapOutcome, (bait: string, missed?: string) => string> = {
  sprung: (bait, missed) => `they took the bait with ${bait}${missed ? `, but ${missed} was the punishment` : ''}`,
  caught: (bait) => `you took the bait with ${bait}`,
  dodged: (bait) => `dodged, ${bait} was never played`,
};

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
  const openings = allOpenings();
  const baits = baitsOf(openings);
  const traps = trapsInGame(baits, game.colour, gameKeys(openings[0], game));
  const xp = gameXp(gameFacts({ game, walk, deviation, traps }, studied));
  const extras =
    traps.length || xp ? (
      <div className="game-play">
        {traps.map((t) => {
          const bait = baits.find((b) => b.trapId === t.trapId)!;
          return (
            <Link key={t.trapId} href={`/openings/${t.trapId}`} className={`trap-pill trap-pill--${t.outcome} game-play__trap`}>
              <Trap size={14} /> {trapTitle(getOpening(t.trapId).name)}: {TRAP_WORDS[t.outcome](bait.num, t.punished === false ? bait.punish?.num : undefined)}
            </Link>
          );
        })}
        {xp ? (
          <Link href="/achievements" className="trap-pill game-play__xp">
            +{xp} XP
          </Link>
        ) : null}
      </div>
    ) : null;

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
        {extras}
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
  const club = getClub(op.id);
  const report = prepReport(op, walk, game, deviation, club);
  const { prep, yours, theirs, practice } = report;
  const plies: BoardStep[] = walkPlies(op, walk)
    .slice(0, report.upTo + 1)
    .map(({ san, fen, from, to, num, turn, check, ev, mate, mark }) => ({ san, fen, from, to, num, turn, check, ev, mate, mark }));
  if (report.upTo === plies.length) {
    const p = game.positions![depth];
    // The engine's answer from here was searched ahead of time with its score: the bar shows that.
    const engine = theirs?.engine;
    plies.push({ san: game.moves[depth], fen: p.fen, from: p.from, to: p.to, num: prep.num, turn: depth % 2 ? 'b' : 'w', check: p.check, ev: engine?.ev, mate: engine?.mate });
  }
  const arrows: BoardArrow[] = [];
  if (yours) {
    if (yours.played.arrow) arrows.push({ ...yours.played.arrow, kind: 'bad' });
    if (yours.course[0].arrow) arrows.push({ ...yours.course[0].arrow, kind: 'good' });
  } else if (theirs?.engine) {
    arrows.push({ from: theirs.engine.from, to: theirs.engine.to, kind: 'engine' });
  } else if (theirs?.answer?.arrow) {
    arrows.push({ ...theirs.answer.arrow, kind: 'good' });
  }
  const met = walk.met;
  const sideline = met?.kind === 'sideline' ? op.sidelines?.items.find((s) => s.slug === met.slug) : undefined;
  const canPractise = !!deviation?.learnedAt && isCard(op, deviation.key);
  const cover = walk.cover ? getOpening(walk.cover) : null;
  const practiseLink = practice ? practiceHref(op.id, practice, !!learned.get(op.id)?.has(practice.slug)) : null;
  // Every score is White's, as on the eval bar; a Black player reading "+0.6" beside the course's move would take it as theirs.
  const whiteScores = walk.side === 'black' ? <p className="muted small">Scores are from White’s side, so as Black you want them low.</p> : null;

  return (
    <main className="page games">
      <Link href="/games" className="back-link">
        ← Your games
      </Link>
      {head}
      {extras}
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
        <div className="game-view__prep">
          <div className="prep-course">
            <Link href={`/openings/${op.id}`} className="chip game-view__course">
              <img src={`/pieces/${walk.side === 'white' ? 'w' : 'b'}P.svg`} alt="" />
              {op.name}
              {isStudied ? '' : ' · not started'}
            </Link>
            <PrepBadge prep={prep} />
          </div>

          {prep.kind === 'you' && yours && deviation ? (
            <section className="card prep prep--you" aria-label="How your opening went">
              <span className="eyebrow">You left your prep</span>
              <h2>
                You played <span className="move move--bad">{deviation.played.num}</span>
              </h2>
              <p className="muted small">In book to move {prep.bookTo}.</p>
              <ul className="prep-moves">
                <ScoredRow kind="bad" label="You played" move={yours.played} />
                {yours.course.map((c, i) => (
                  <ScoredRow key={c.num} kind="good" label={i ? 'Or' : 'The course plays'} move={c} />
                ))}
              </ul>
              {yours.played.score || yours.course.some((c) => c.score) ? whiteScores : null}
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
                      ? `You haven’t learned the ${practice?.sideline ? 'sideline' : 'chapter'} that teaches it yet.`
                      : 'Start the course to learn it.'}
              </p>
              <div className="game-exit__actions">
                {canPractise ? (
                  <Link href={`/games/practice?course=${op.id}&key=${encodeURIComponent(deviation.key)}`} className="btn btn--primary">
                    <Play size={18} /> Practise this
                  </Link>
                ) : null}
                {practiseLink ? (
                  <Link href={practiseLink.href} className={`btn ${canPractise ? 'btn--secondary' : 'btn--primary'}`} title={practice!.name}>
                    {practiseLink.label}
                  </Link>
                ) : null}
              </div>
            </section>
          ) : prep.kind === 'new' && theirs ? (
            <section className="card prep prep--new" aria-label="How your opening went">
              <span className="eyebrow">New territory</span>
              <h2>
                They played <span className="move">{theirs.num}</span>
              </h2>
              <p>
                The course stops here: it has no answer to {theirs.num} yet. You were in book to move {prep.bookTo}
                {cover ? `, and the ${cover.name} course goes on from here` : ''}.
              </p>
              {theirs.club && club ? <ClubLine share={theirs.club} elo={club.elo} /> : null}
              {theirs.engine ? (
                <div className="prep-engine">
                  <span className="eyebrow prep-engine__label">The engine’s reply</span>
                  <span>
                    <b className="move">{theirs.engine.num}</b> <Score score={theirs.engine} />
                  </span>
                  <span className="muted small">
                    {theirs.engine.line}. Stockfish’s choice, searched ahead of time, not course theory.
                  </span>
                  {whiteScores}
                </div>
              ) : null}
              {cover ? (
                <Link href={`/openings/${cover.id}`} className="btn btn--secondary game-cover-btn">
                  See the {cover.name}
                </Link>
              ) : null}
            </section>
          ) : prep.kind === 'covered' && theirs ? (
            <section className="card prep prep--covered" aria-label="How your opening went">
              <span className="eyebrow">They left the main line. Your course was ready.</span>
              <h2>
                They played <span className="move">{theirs.num}</span>
              </h2>
              <p>
                {theirs.sideline ? 'A sideline the course teaches' : SEV_WORDS[theirs.sev ?? 'playable']}
                {theirs.name ? ` (${theirs.name})` : ''}.
                {prep.over ? ' The game ended inside your prep.' : ` You stayed in book to move ${prep.bookTo}.`}
              </p>
              {theirs.club && club ? <ClubLine share={theirs.club} elo={club.elo} /> : null}
              {theirs.answer ? (
                <ul className="prep-moves">
                  <ScoredRow kind="good" label="The course answers" move={theirs.answer} found={theirs.answer.found} />
                </ul>
              ) : null}
              {theirs.answer?.score ? whiteScores : null}
              {theirs.why ? <p className="muted" dangerouslySetInnerHTML={{ __html: theirs.why }} /> : null}
              {theirs.sideline && !theirs.why ? <p className="muted">{theirs.sideline.short}</p> : null}
              <div className="game-exit__actions">
                {theirs.sideline ? (
                  <Link href={`/openings/${op.id}/${theirs.sideline.slug}/learn`} className="btn btn--secondary">
                    Learn the sideline
                  </Link>
                ) : theirs.sev && theirs.sev !== 'playable' ? (
                  <Link href={`/openings/${op.id}/punish`} className="btn btn--secondary">
                    Practise punishing mistakes
                  </Link>
                ) : null}
              </div>
            </section>
          ) : (
            <section className="card prep prep--book" aria-label="How your opening went">
              <Burst />
              <span className="eyebrow">In book all the way</span>
              <h2>{prep.over ? 'The game ended inside your prep' : `In book to move ${prep.bookTo}`}</h2>
              <p>
                {plural(yourMoves(walk), 'move')} of yours, and every one was the course’s.
                {prep.over ? '' : ' The course ends there, so from then on the game was your own.'}
              </p>
            </section>
          )}

        </div>
        <div className="game-view__side">
          {walk.detours.length ? (
            <p className="muted small game-view__detour">
              The game left the course at {moveNum(walk.detours[0].from, game.moves[walk.detours[0].from])} and came back to it at{' '}
              {moveNum(walk.detours[0].to, game.moves[walk.detours[0].to])} by another move order, so it’s compared from there.
            </p>
          ) : null}

          {met && met.kind !== 'uncovered' && prep.kind !== 'covered' ? (
            <section className="card game-met">
              <p>
                Earlier, at <b className="move">{met.num}</b>, your opponent left the chapters
                {met.kind === 'sideline' ? ' for a sideline the course teaches' : ' for a move the course has an answer to'}
                {met.name ? ` (${met.name})` : ''}.
              </p>
              {sideline && practice?.slug !== sideline.slug ? (
                <Link href={`/openings/${op.id}/${sideline.slug}/learn`} className="btn btn--secondary btn--sm">
                  Learn the sideline
                </Link>
              ) : null}
            </section>
          ) : null}

          <section className="card game-moves" aria-label="The moves">
            <h3>The whole game</h3>
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

const SEV_WORDS: Record<Severity, string> = {
  blunder: 'A mistake the course punishes',
  inaccuracy: 'An inaccuracy the course punishes',
  playable: 'A sound move the course answers',
};

/** The learner's own moves the game played in the course's tree. */
const yourMoves = (w: Walk) => w.steps.filter((s, i) => i > 0 && s.book && (i % 2 === 1) === (w.side === 'white')).length;

function practiceHref(openingId: string, p: PracticeLink, learned: boolean) {
  const what = p.sideline ? 'the sideline' : `chapter ${p.chapter}`;
  if (!learned) return { href: `/openings/${openingId}/${p.slug}/learn`, label: `Learn ${what}` };
  return {
    href: `/openings/${openingId}/${p.slug}/drill${p.ply !== null ? `?ply=${p.ply}` : ''}`,
    label: `Drill ${what} from here`,
  };
}

function Score({ score }: { score: Parameters<typeof evalText>[0] | null }) {
  return score ? <span className="prep-score">{evalText(score)}</span> : null;
}

function ScoredRow({ kind, label, move, found }: { kind: 'good' | 'bad'; label: string; move: ScoredMove; found?: boolean }) {
  return (
    <li className={`prep-move prep-move--${kind}`}>
      <span className="prep-move__label">{label}</span>
      <b className={`move move--${kind}`}>{move.num}</b>
      <Score score={move.score} />
      {found ? <span className="prep-move__found">You found it</span> : null}
    </li>
  );
}

function ClubLine({ share, elo }: { share: { pct: number; games: number }; elo: [number, number] }) {
  return (
    <p className="prep-club">
      <span className="prep-club__meter" aria-hidden="true">
        <span style={{ width: `${share.pct}%` }} />
      </span>
      <span>
        Club players rated {elo[0]}-{elo[1]} choose it in <b>{share.pct}%</b> of {share.games.toLocaleString('en-GB')} games here.
      </span>
    </p>
  );
}
